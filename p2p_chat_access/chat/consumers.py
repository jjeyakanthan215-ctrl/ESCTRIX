import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
from django.utils import timezone
from django.db.models import Q
from accounts.models import Friendship
from chat.models import ChatGroup, ChatGroupMember, ChatMessage, PendingMessage, ChatGroupMessage, MessageReaction

User = get_user_model()

class SignalingConsumer(AsyncWebsocketConsumer):
    # Class-level set to keep track of active online usernames
    online_users = set()

    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
            return
            
        self.username = self.user.username
        self.room_group_name = f'user_{self.username}'

        # Add to online users
        SignalingConsumer.online_users.add(self.username)

        # Join personal group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Join all group chat rooms they belong to
        group_ids = await self.get_user_group_ids()
        for gid in group_ids:
            await self.channel_layer.group_add(
                f'group_{gid}',
                self.channel_name
            )

        await self.accept()

        # Broadcast online status to all friends
        await self.broadcast_status(True)

        # Deliver pending offline messages
        await self.deliver_pending_messages()

    async def disconnect(self, close_code):
        if not self.user.is_anonymous:
            # Remove from online users
            SignalingConsumer.online_users.discard(self.username)

            # Broadcast offline status to all friends
            await self.broadcast_status(False)

            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            
            # Discard from group chat rooms
            group_ids = await self.get_user_group_ids()
            for gid in group_ids:
                await self.channel_layer.group_discard(
                    f'group_{gid}',
                    self.channel_name
                )

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type')
        payload = data.get('data', {})

        # WebRTC & Chat Routing
        target_username = payload.get('target_username')
        
        if msg_type in ['CALL_REQUEST', 'OFFER', 'ANSWER', 'ICE_CANDIDATE', 'HANG_UP']:
            if not target_username:
                return

            # Check mutual friendship
            is_friend = await self.check_friendship(self.user, target_username)
            if not is_friend:
                await self.send(text_data=json.dumps({
                    'type': 'ERROR',
                    'error': 'You can only communicate with mutual friends.'
                }))
                return

            # Route to target user's group
            target_group = f'user_{target_username}'
            
            forward_type = msg_type
            if msg_type == 'CALL_REQUEST':
                forward_type = 'INCOMING_CALL'
            
            forward_data = payload.copy()
            forward_data['from_username'] = self.username
            if msg_type == 'CALL_REQUEST':
                forward_data['caller_username'] = self.username
                forward_data['caller_display_name'] = self.user.display_name

            await self.channel_layer.group_send(
                target_group,
                {
                    'type': 'forward_message',
                    'msg_type': forward_type,
                    'data': forward_data
                }
            )
            
        elif msg_type == 'CHAT_MESSAGE':
            if not target_username:
                return

            is_friend = await self.check_friendship(self.user, target_username)
            if not is_friend:
                await self.send(text_data=json.dumps({
                    'type': 'ERROR',
                    'error': 'You can only communicate with mutual friends.'
                }))
                return

            encrypted_content = payload.get('encrypted_content')
            expires_in_sec = payload.get('expires_in')  # Disappearing messages timer (seconds)
            
            expires_at = None
            if expires_in_sec:
                expires_at = timezone.now() + timezone.timedelta(seconds=int(expires_in_sec))

            # Save to Database
            msg_id = await self.save_chat_message(self.user, target_username, encrypted_content, expires_at)

            is_online = target_username in SignalingConsumer.online_users

            # If recipient is offline, save to PendingMessage
            if not is_online:
                await self.save_pending_message(self.user, target_username, encrypted_content)

            # Send to target
            target_group = f'user_{target_username}'
            await self.channel_layer.group_send(
                target_group,
                {
                    'type': 'forward_message',
                    'msg_type': 'CHAT_MESSAGE',
                    'data': {
                        'id': msg_id,
                        'from_username': self.username,
                        'encrypted_content': encrypted_content,
                        'timestamp': timezone.now().isoformat(),
                        'expires_at': expires_at.isoformat() if expires_at else None
                    }
                }
            )

            # Send delivery receipt if online, else just let the sender know it's stored on server
            await self.send(text_data=json.dumps({
                'type': 'CHAT_STATUS',
                'data': {
                    'id': msg_id,
                    'status': 'delivered' if is_online else 'sent'
                }
            }))

        elif msg_type == 'CALL_ACCEPT':
            caller_username = payload.get('caller_username')
            await self.channel_layer.group_send(
                f'user_{caller_username}',
                {
                    'type': 'forward_message',
                    'msg_type': 'CALL_ACCEPTED',
                    'data': {'target_username': self.username}
                }
            )
            
        elif msg_type == 'CALL_REJECT':
            caller_username = payload.get('caller_username')
            await self.channel_layer.group_send(
                f'user_{caller_username}',
                {
                    'type': 'forward_message',
                    'msg_type': 'CALL_REJECTED',
                    'data': {'target_username': self.username}
                }
            )
            
        elif msg_type == 'FRIEND_LIST':
            friends = await self.get_friends_list()
            await self.send(text_data=json.dumps({
                'type': 'FRIEND_LIST_RESPONSE',
                'success': True,
                'data': {'friends': friends}
            }))

        elif msg_type == 'GROUP_MESSAGE':
            group_id = payload.get('group_id')
            encrypted_content = payload.get('encrypted_content')
            expires_in_sec = payload.get('expires_in')
            
            if not group_id:
                return

            is_member = await self.check_group_membership(group_id)
            if not is_member:
                await self.send(text_data=json.dumps({
                    'type': 'ERROR',
                    'error': 'You are not a member of this group.'
                }))
                return

            expires_at = None
            if expires_in_sec:
                expires_at = timezone.now() + timezone.timedelta(seconds=int(expires_in_sec))

            # Save group message in DB
            msg_id = await self.save_group_message(group_id, self.user, encrypted_content, expires_at)

            # Broadcast to channels group
            await self.channel_layer.group_send(
                f'group_{group_id}',
                {
                    'type': 'forward_group_message',
                    'id': msg_id,
                    'group_id': group_id,
                    'sender': self.username,
                    'encrypted_content': encrypted_content,
                    'timestamp': timezone.now().isoformat(),
                    'expires_at': expires_at.isoformat() if expires_at else None
                }
            )

        elif msg_type == 'JOIN_GROUP':
            group_id = payload.get('group_id')
            if group_id and await self.check_group_membership(group_id):
                await self.channel_layer.group_add(
                    f'group_{group_id}',
                    self.channel_name
                )

        # Advanced Feature: Typing Indicators
        elif msg_type == 'TYPING':
            is_typing = payload.get('is_typing', False)
            group_id = payload.get('group_id')

            if group_id:
                if await self.check_group_membership(group_id):
                    await self.channel_layer.group_send(
                        f'group_{group_id}',
                        {
                            'type': 'forward_group_typing',
                            'group_id': group_id,
                            'sender': self.username,
                            'is_typing': is_typing
                        }
                    )
            elif target_username:
                await self.channel_layer.group_send(
                    f'user_{target_username}',
                    {
                        'type': 'forward_message',
                        'msg_type': 'TYPING',
                        'data': {
                            'from_username': self.username,
                            'is_typing': is_typing
                        }
                    }
                )

        # Advanced Feature: Read Receipts
        elif msg_type == 'READ_RECEIPT':
            message_id = payload.get('message_id')
            message_type = payload.get('message_type', 'direct') # direct or group

            await self.mark_message_as_read(message_id, message_type)
            
            if message_type == 'direct' and target_username:
                await self.channel_layer.group_send(
                    f'user_{target_username}',
                    {
                        'type': 'forward_message',
                        'msg_type': 'READ_RECEIPT',
                        'data': {
                            'message_id': message_id,
                            'reader': self.username
                        }
                    }
                )

        # Advanced Feature: Reactions
        elif msg_type == 'MESSAGE_REACTION':
            message_id = payload.get('message_id')
            message_type = payload.get('message_type', 'direct')
            emoji = payload.get('emoji')
            group_id = payload.get('group_id')

            if message_id and emoji:
                await self.save_message_reaction(message_id, message_type, emoji)

                if message_type == 'group' and group_id:
                    await self.channel_layer.group_send(
                        f'group_{group_id}',
                        {
                            'type': 'forward_group_reaction',
                            'message_id': message_id,
                            'group_id': group_id,
                            'sender': self.username,
                            'emoji': emoji
                        }
                    )
                elif message_type == 'direct' and target_username:
                    await self.channel_layer.group_send(
                        f'user_{target_username}',
                        {
                            'type': 'forward_message',
                            'msg_type': 'MESSAGE_REACTION',
                            'data': {
                                'message_id': message_id,
                                'from_username': self.username,
                                'emoji': emoji
                            }
                        }
                    )

    async def forward_message(self, event):
        await self.send(text_data=json.dumps({
            'type': event['msg_type'],
            'data': event['data']
        }))

    async def forward_group_message(self, event):
        # Don't send back to the sender
        if event['sender'] == self.username:
            return
        await self.send(text_data=json.dumps({
            'type': 'GROUP_MESSAGE',
            'data': {
                'id': event['id'],
                'group_id': event['group_id'],
                'from_username': event['sender'],
                'encrypted_content': event['encrypted_content'],
                'timestamp': event['timestamp'],
                'expires_at': event['expires_at']
            }
        }))

    async def forward_group_typing(self, event):
        if event['sender'] == self.username:
            return
        await self.send(text_data=json.dumps({
            'type': 'GROUP_TYPING',
            'data': {
                'group_id': event['group_id'],
                'from_username': event['sender'],
                'is_typing': event['is_typing']
            }
        }))

    async def forward_group_reaction(self, event):
        if event['sender'] == self.username:
            return
        await self.send(text_data=json.dumps({
            'type': 'GROUP_REACTION',
            'data': {
                'message_id': event['message_id'],
                'group_id': event['group_id'],
                'from_username': event['sender'],
                'emoji': event['emoji']
            }
        }))

    async def broadcast_status(self, is_online):
        """Helper to inform mutual friends about our status change."""
        friends = await self.get_friends_list()
        for f in friends:
            await self.channel_layer.group_send(
                f'user_{f["username"]}',
                {
                    'type': 'forward_message',
                    'msg_type': 'FRIEND_STATUS',
                    'data': {
                        'username': self.username,
                        'is_online': is_online
                    }
                }
            )

    async def deliver_pending_messages(self):
        """Deliver all accumulated offline messages and delete them from PendingMessage."""
        pending = await self.get_and_clear_pending_messages()
        for p in pending:
            await self.send(text_data=json.dumps({
                'type': 'CHAT_MESSAGE',
                'data': {
                    'from_username': p['sender'],
                    'encrypted_content': p['content'],
                    'timestamp': p['created_at']
                }
            }))

    @sync_to_async
    def get_and_clear_pending_messages(self):
        pending_qs = PendingMessage.objects.filter(recipient=self.user)
        pending_list = [{
            'sender': p.sender.username,
            'content': p.encrypted_content,
            'created_at': p.created_at.isoformat()
        } for p in pending_qs]
        pending_qs.delete()
        return pending_list

    @sync_to_async
    def save_chat_message(self, sender, recipient_username, encrypted_content, expires_at=None):
        recipient = User.objects.get(username=recipient_username)
        msg = ChatMessage.objects.create(
            sender=sender,
            recipient=recipient,
            encrypted_content=encrypted_content,
            expires_at=expires_at
        )
        return msg.id

    @sync_to_async
    def save_pending_message(self, sender, recipient_username, encrypted_content):
        recipient = User.objects.get(username=recipient_username)
        PendingMessage.objects.create(
            sender=sender,
            recipient=recipient,
            encrypted_content=encrypted_content
        )

    @sync_to_async
    def save_group_message(self, group_id, sender, encrypted_content, expires_at=None):
        group = ChatGroup.objects.get(id=group_id)
        msg = ChatGroupMessage.objects.create(
            group=group,
            sender=sender,
            encrypted_content=encrypted_content,
            expires_at=expires_at
        )
        return msg.id

    @sync_to_async
    def mark_message_as_read(self, message_id, message_type):
        try:
            if message_type == 'direct':
                msg = ChatMessage.objects.get(id=message_id)
                msg.is_read = True
                msg.save()
        except Exception:
            pass

    @sync_to_async
    def save_message_reaction(self, message_id, message_type, emoji):
        MessageReaction.objects.update_or_create(
            message_type=message_type,
            message_id=message_id,
            user=self.user,
            defaults={'emoji': emoji}
        )

    @sync_to_async
    def check_friendship(self, user, target_username):
        try:
            target = User.objects.get(username=target_username)
            f1 = Friendship.objects.filter(user=user, friend=target, status='accepted').exists()
            f2 = Friendship.objects.filter(user=target, friend=user, status='accepted').exists()
            return f1 or f2
        except User.DoesNotExist:
            return False

    @sync_to_async
    def get_friends_list(self):
        friends_data = []
        for f in Friendship.objects.filter(user=self.user, status='accepted'):
            is_online = f.friend.username in SignalingConsumer.online_users
            friends_data.append({
                'username': f.friend.username,
                'display_name': f.friend.display_name,
                'avatar_index': f.friend.avatar_index,
                'is_online': is_online 
            })
        for f in Friendship.objects.filter(friend=self.user, status='accepted'):
            is_online = f.user.username in SignalingConsumer.online_users
            friends_data.append({
                'username': f.user.username,
                'display_name': f.user.display_name,
                'avatar_index': f.user.avatar_index,
                'is_online': is_online
            })
        unique = {f['username']: f for f in friends_data}
        return list(unique.values())

    @sync_to_async
    def get_user_group_ids(self):
        return list(ChatGroupMember.objects.filter(user=self.user).values_list('group_id', flat=True))

    @sync_to_async
    def check_group_membership(self, group_id):
        return ChatGroupMember.objects.filter(group_id=group_id, user=self.user).exists()
