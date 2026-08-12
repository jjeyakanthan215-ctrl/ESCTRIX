from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
import json
import re
from datetime import timedelta, datetime
from django.utils import timezone
from .models import CustomUser, Friendship, BlockList, HelpTicket, GuestContactRequest, UserStory
from chat.models import ChatGroup, ChatGroupMember, ChatMessage, ChatGroupMessage, MessageReaction

@ensure_csrf_cookie
def home(request):
    if not request.user.is_authenticated:
        return redirect('auth')
    return render(request, 'home.html')

@ensure_csrf_cookie
def auth_view(request):
    if request.user.is_authenticated:
        return redirect('home')
    return render(request, 'auth.html')

def privacy_policy_view(request):
    return render(request, 'legal/privacy.html')

def terms_view(request):
    return render(request, 'legal/terms.html')

def security_view(request):
    return render(request, 'legal/security.html')

def api_guest_contact(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name    = data.get('name', 'Anonymous').strip()[:80]
            email   = data.get('email', '').strip()[:254]
            issue   = data.get('issue', 'other')
            message = data.get('message', '').strip()
            if not message:
                return JsonResponse({'success': False, 'error': 'Message cannot be empty.'}, status=400)
            valid_issues = [k for k, _ in GuestContactRequest.ISSUE_CHOICES]
            if issue not in valid_issues:
                issue = 'other'
            GuestContactRequest.objects.create(name=name, email=email, issue=issue, message=message)
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

def api_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return JsonResponse({
                    'success': True,
                    'username': user.username,
                    'is_admin': user.is_staff or user.is_superuser
                })
            else:
                return JsonResponse({'success': False, 'error': 'Invalid credentials'}, status=401)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

def api_register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            display_name = data.get('display_name')
            password = data.get('password')
            dob_str = data.get('date_of_birth')

            if CustomUser.objects.filter(username=username).exists():
                return JsonResponse({'success': False, 'error': 'Username already exists'}, status=400)

            dob = None
            if dob_str:
                try:
                    dob = datetime.strptime(dob_str, '%Y-%m-%d').date()
                except ValueError:
                    return JsonResponse({'success': False, 'error': 'Invalid date of birth format. Use YYYY-MM-DD'}, status=400)

            user = CustomUser.objects.create_user(
                username=username, 
                password=password, 
                display_name=display_name,
                date_of_birth=dob
            )
            login(request, user)
            return JsonResponse({'success': True, 'username': user.username})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

from django.db.models import Q
from .models import CustomUser, Friendship

def api_logout(request):
    logout(request)
    return JsonResponse({'success': True})

def api_search(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    
    query = request.GET.get('q', '').strip()
    if not query:
        return JsonResponse({'success': True, 'results': []})
        
    users = CustomUser.objects.filter(
        Q(username__icontains=query) | Q(display_name__icontains=query)
    ).exclude(id=request.user.id)[:20]
    
    results = []
    for u in users:
        # Check if there is an existing friendship
        status = 'none'
        friendship = Friendship.objects.filter(
            Q(user=request.user, friend=u) | Q(user=u, friend=request.user)
        ).first()
        
        if friendship:
            if friendship.status == 'accepted':
                status = 'friends'
            elif friendship.status == 'pending':
                if friendship.user == request.user:
                    status = 'sent'
                else:
                    status = 'received'
                    
        results.append({
            'username': u.username,
            'display_name': u.display_name,
            'avatar_index': u.avatar_index,
            'status': status
        })
        
    return JsonResponse({'success': True, 'results': results})

def api_send_friend_request(request):
    if not request.user.is_authenticated or request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Unauthorized or invalid method'}, status=401)
        
    try:
        data = json.loads(request.body)
        target_username = data.get('target_username')
        target_user = CustomUser.objects.get(username=target_username)
        
        # Check existing
        existing = Friendship.objects.filter(
            Q(user=request.user, friend=target_user) | Q(user=target_user, friend=request.user)
        ).exists()
        
        if not existing:
            Friendship.objects.create(user=request.user, friend=target_user, status='pending')
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'Friendship already exists or request pending'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

def api_accept_friend_request(request):
    if not request.user.is_authenticated or request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
        
    try:
        data = json.loads(request.body)
        sender_username = data.get('sender_username')
        sender_user = CustomUser.objects.get(username=sender_username)
        
        friendship = Friendship.objects.get(user=sender_user, friend=request.user, status='pending')
        friendship.status = 'accepted'
        friendship.save()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

def api_decline_friend_request(request):
    if not request.user.is_authenticated or request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
        
    try:
        data = json.loads(request.body)
        sender_username = data.get('sender_username')
        sender_user = CustomUser.objects.get(username=sender_username)
        
        Friendship.objects.filter(
            Q(user=sender_user, friend=request.user) | Q(user=request.user, friend=sender_user)
        ).delete()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

def api_pending_requests(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
        
    requests = Friendship.objects.filter(friend=request.user, status='pending')
    results = [{
        'username': r.user.username,
        'display_name': r.user.display_name,
        'avatar_index': r.user.avatar_index
    } for r in requests]
    return JsonResponse({'success': True, 'requests': results})

def api_update_profile(request):
    if not request.user.is_authenticated or request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    try:
        data = json.loads(request.body)
        user = request.user
        
        # Username update and validation
        if 'username' in data and data['username']:
            username = data['username']
            new_username = username.lower().strip()
            if new_username != user.username:
                # Validation checks
                if len(new_username) < 3 or len(new_username) > 20:
                    return JsonResponse({'success': False, 'error': 'Username must be 3-20 characters'}, status=400)
                if not re.match(r'^[a-z0-9_]+$', new_username):
                    return JsonResponse({'success': False, 'error': 'Username can only contain lowercase letters, numbers, and underscores'}, status=400)
                if new_username in {'admin', 'system', 'cipher6', 'support', 'null', 'undefined', 'esctrix'}:
                    return JsonResponse({'success': False, 'error': 'This username is reserved'}, status=400)
                if CustomUser.objects.filter(username=new_username).exclude(id=user.id).exists():
                    return JsonResponse({'success': False, 'error': 'Username is already taken'}, status=400)
                
                # Check cooldown
                if user.username_last_changed:
                    cooldown = timedelta(days=14)
                    next_allowed = user.username_last_changed + cooldown
                    now = timezone.now()
                    if now < next_allowed:
                        diff = next_allowed - now
                        days = diff.days
                        hours = diff.seconds // 3600
                        return JsonResponse({
                            'success': False,
                            'error': f'You can only change your username once every 14 days. Try again in {days} days, {hours} hours.'
                        }, status=400)
                
                user.username = new_username
                user.username_last_changed = timezone.now()
                
        if 'display_name' in data and data['display_name']:
            user.display_name = data['display_name'].strip()
            
        if 'bio' in data:
            user.bio = data['bio'].strip() if data['bio'] else ''
            
        if 'avatar_index' in data and data['avatar_index'] is not None:
            user.avatar_index = int(data['avatar_index'])
            
        if 'date_of_birth' in data:
            dob_str = data['date_of_birth']
            if dob_str:
                try:
                    user.date_of_birth = datetime.strptime(dob_str, '%Y-%m-%d').date()
                except ValueError:
                    return JsonResponse({'success': False, 'error': 'Invalid date of birth format. Use YYYY-MM-DD'}, status=400)
            else:
                user.date_of_birth = None
            
        user.save()
        return JsonResponse({'success': True, 'username': user.username, 'avatar_index': user.avatar_index})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

def api_change_password(request):
    if not request.user.is_authenticated or request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    try:
        data = json.loads(request.body)
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        
        user = request.user
        if not user.check_password(old_password):
            return JsonResponse({'success': False, 'error': 'Incorrect old password'}, status=400)
            
        user.set_password(new_password)
        user.save()
        login(request, user)
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

def api_cancel_friend_request(request):
    if not request.user.is_authenticated or request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    try:
        data = json.loads(request.body)
        target_username = data.get('target_username')
        target_user = CustomUser.objects.get(username=target_username)
        
        Friendship.objects.filter(
            user=request.user, friend=target_user, status='pending'
        ).delete()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

def api_remove_friend(request):
    if not request.user.is_authenticated or request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    try:
        data = json.loads(request.body)
        target_username = data.get('target_username')
        target_user = CustomUser.objects.get(username=target_username)
        
        Friendship.objects.filter(
            Q(user=request.user, friend=target_user) | Q(user=target_user, friend=request.user)
        ).delete()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

def api_get_user_profile(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    username = request.GET.get('username')
    try:
        u = CustomUser.objects.get(username=username)
        is_friend = Friendship.objects.filter(
            Q(user=request.user, friend=u, status='accepted') | Q(user=u, friend=request.user, status='accepted')
        ).exists()
        is_request_sent = Friendship.objects.filter(user=request.user, friend=u, status='pending').exists()
        is_request_received = Friendship.objects.filter(user=u, friend=request.user, status='pending').exists()
        is_blocked = BlockList.objects.filter(user=request.user, blocked_user=u).exists()
        
        return JsonResponse({
            'success': True,
            'user': {
                'username': u.username,
                'display_name': u.display_name,
                'bio': u.bio,
                'avatar_index': u.avatar_index,
                'date_of_birth': u.date_of_birth.strftime('%Y-%m-%d') if u.date_of_birth else None,
            },
            'is_friend': is_friend,
            'is_request_sent': is_request_sent,
            'is_request_received': is_request_received,
            'is_blocked': is_blocked
        })
    except CustomUser.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User not found'}, status=404)

def api_block_user(request):
    if not request.user.is_authenticated or request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    try:
        data = json.loads(request.body)
        target_username = data.get('target_username')
        target_user = CustomUser.objects.get(username=target_username)
        
        BlockList.objects.get_or_create(user=request.user, blocked_user=target_user)
        
        Friendship.objects.filter(
            Q(user=request.user, friend=target_user) | Q(user=target_user, friend=request.user)
        ).delete()
        
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

def api_unblock_user(request):
    if not request.user.is_authenticated or request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    try:
        data = json.loads(request.body)
        target_username = data.get('target_username')
        target_user = CustomUser.objects.get(username=target_username)
        
        BlockList.objects.filter(user=request.user, blocked_user=target_user).delete()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

def api_block_list(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    blocks = BlockList.objects.filter(user=request.user)
    results = [{
        'username': b.blocked_user.username,
        'display_name': b.blocked_user.display_name,
        'avatar_index': b.blocked_user.avatar_index
    } for b in blocks]
    return JsonResponse({'success': True, 'blocks': results})

def api_create_group(request):
    if not request.user.is_authenticated or request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    try:
        data = json.loads(request.body)
        group_name = data.get('name')
        member_usernames = data.get('members', [])
        
        group = ChatGroup.objects.create(name=group_name, created_by=request.user)
        
        ChatGroupMember.objects.create(group=group, user=request.user)
        
        for uname in member_usernames:
            try:
                u = CustomUser.objects.get(username=uname)
                ChatGroupMember.objects.get_or_create(group=group, user=u)
            except CustomUser.DoesNotExist:
                pass
                
        return JsonResponse({'success': True, 'group_id': group.id, 'name': group.name})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

def api_group_list(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    memberships = ChatGroupMember.objects.filter(user=request.user)
    results = [{
        'id': m.group.id,
        'name': m.group.name,
        'created_at': m.group.created_at.strftime('%Y-%m-%d')
    } for m in memberships]
    return JsonResponse({'success': True, 'groups': results})

def api_group_members(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    group_id = request.GET.get('group_id')
    try:
        group = ChatGroup.objects.get(id=group_id)
        if not ChatGroupMember.objects.filter(group=group, user=request.user).exists():
            return JsonResponse({'success': False, 'error': 'Not member of this group'}, status=403)
        members = ChatGroupMember.objects.filter(group=group)
        results = [{
            'username': m.user.username,
            'display_name': m.user.display_name,
            'avatar_index': m.user.avatar_index
        } for m in members]
        return JsonResponse({'success': True, 'members': results})
    except ChatGroup.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Group not found'}, status=404)

def api_chat_history(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    
    target_username = request.GET.get('target_username')
    if not target_username:
        return JsonResponse({'success': False, 'error': 'target_username is required'}, status=400)
        
    try:
        target_user = CustomUser.objects.get(username=target_username)
        
        # Mark unread received messages as read
        ChatMessage.objects.filter(sender=target_user, recipient=request.user, is_read=False).update(is_read=True)
        
        # Fetch non-expired messages
        now = timezone.now()
        messages = ChatMessage.objects.filter(
            Q(sender=request.user, recipient=target_user) | Q(sender=target_user, recipient=request.user)
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        ).order_by('created_at')[:100]
        
        # Fetch reactions for these messages
        msg_ids = [m.id for m in messages]
        reactions_qs = MessageReaction.objects.filter(message_type='direct', message_id__in=msg_ids)
        reactions_map = {}
        for r in reactions_qs:
            if r.message_id not in reactions_map:
                reactions_map[r.message_id] = []
            reactions_map[r.message_id].append({
                'username': r.user.username,
                'emoji': r.emoji
            })
            
        results = []
        for m in messages:
            results.append({
                'id': m.id,
                'from_username': m.sender.username,
                'encrypted_content': m.encrypted_content,
                'timestamp': m.created_at.isoformat(),
                'is_read': m.is_read,
                'expires_at': m.expires_at.isoformat() if m.expires_at else None,
                'reactions': reactions_map.get(m.id, [])
            })
            
        return JsonResponse({'success': True, 'messages': results})
    except CustomUser.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User not found'}, status=404)

def api_group_history(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
        
    group_id = request.GET.get('group_id')
    if not group_id:
        return JsonResponse({'success': False, 'error': 'group_id is required'}, status=400)
        
    try:
        group = ChatGroup.objects.get(id=group_id)
        if not ChatGroupMember.objects.filter(group=group, user=request.user).exists():
            return JsonResponse({'success': False, 'error': 'Not member of this group'}, status=403)
            
        # Fetch non-expired group messages
        now = timezone.now()
        messages = ChatGroupMessage.objects.filter(group=group).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        ).order_by('created_at')[:100]
        
        # Fetch reactions for these messages
        msg_ids = [m.id for m in messages]
        reactions_qs = MessageReaction.objects.filter(message_type='group', message_id__in=msg_ids)
        reactions_map = {}
        for r in reactions_qs:
            if r.message_id not in reactions_map:
                reactions_map[r.message_id] = []
            reactions_map[r.message_id].append({
                'username': r.user.username,
                'emoji': r.emoji
            })
            
        results = []
        for m in messages:
            results.append({
                'id': m.id,
                'from_username': m.sender.username,
                'encrypted_content': m.encrypted_content,
                'timestamp': m.created_at.isoformat(),
                'expires_at': m.expires_at.isoformat() if m.expires_at else None,
                'reactions': reactions_map.get(m.id, [])
            })
            
        return JsonResponse({'success': True, 'messages': results})
    except ChatGroup.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Group not found'}, status=404)

def api_media_upload(request):
    import os
    import uuid
    from django.conf import settings
    from django.core.files.storage import default_storage
    
    if not request.user.is_authenticated or request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
        
    if 'file' not in request.FILES:
        return JsonResponse({'success': False, 'error': 'No file uploaded'}, status=400)
        
    uploaded_file = request.FILES['file']
    ext = os.path.splitext(uploaded_file.name)[1]
    filename = f"uploads/{uuid.uuid4()}{ext}"
    
    saved_path = default_storage.save(filename, uploaded_file)
    file_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path)
    
    return JsonResponse({
        'success': True,
        'url': file_url,
        'name': uploaded_file.name,
        'mime_type': uploaded_file.content_type
    })

def api_forgot_password(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            dob_str = data.get('date_of_birth')
            
            if not username or not dob_str:
                return JsonResponse({'success': False, 'error': 'Username and Date of Birth are required'}, status=400)
                
            try:
                dob = datetime.strptime(dob_str, '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({'success': False, 'error': 'Invalid Date of Birth format. Use YYYY-MM-DD'}, status=400)
                
            try:
                user = CustomUser.objects.get(username=username, date_of_birth=dob)
                request.session['password_reset_user'] = user.username
                return JsonResponse({'success': True})
            except CustomUser.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Invalid Username or Date of Birth verification failed'}, status=400)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

def api_reset_password(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            new_password = data.get('new_password')
            
            reset_username = request.session.get('password_reset_user')
            if not reset_username:
                return JsonResponse({'success': False, 'error': 'Session expired or not authorized to reset password'}, status=403)
                
            if not new_password or len(new_password) < 8:
                return JsonResponse({'success': False, 'error': 'Password must be at least 8 characters'}, status=400)
                
            try:
                user = CustomUser.objects.get(username=reset_username)
                user.set_password(new_password)
                user.save()
                login(request, user)
                del request.session['password_reset_user']
                return JsonResponse({'success': True, 'username': user.username})
            except CustomUser.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

def api_submit_help_ticket(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            subject = data.get('subject')
            message = data.get('message')
            
            if not subject or not message:
                return JsonResponse({'success': False, 'error': 'Subject and Message are required'}, status=400)
                
            ticket = HelpTicket.objects.create(
                user=request.user,
                subject=subject,
                message=message,
                status='open'
            )
            return JsonResponse({'success': True, 'ticket_id': ticket.id})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

def api_get_help_tickets(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    if request.method == 'GET':
        try:
            tickets = HelpTicket.objects.filter(user=request.user).order_by('-created_at')
            results = []
            for t in tickets:
                results.append({
                    'id': t.id,
                    'subject': t.subject,
                    'message': t.message,
                    'status': t.status,
                    'created_at': t.created_at.isoformat()
                })
            return JsonResponse({'success': True, 'tickets': results})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

def api_check_username(request):
    username = request.GET.get('username', '').strip().lower()
    if not username:
        return JsonResponse({'available': False, 'error': 'Empty username'})
    
    # Validation matches registration rules: alphanumeric + underscores, 3-30 chars
    if not re.match(r'^[a-zA-Z0-9_]{3,30}$', username):
        return JsonResponse({'available': False, 'error': 'Invalid username format'})
        
    exists = CustomUser.objects.filter(username__iexact=username).exists()
    return JsonResponse({'available': not exists})

def api_create_story(request):
    if not request.user.is_authenticated or request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    try:
        data = json.loads(request.body)
        caption = data.get('caption', '').strip()
        media_data = data.get('media_data', '').strip()
        bg_color = data.get('bg_color', '#7c3aed').strip()
        
        expires = timezone.now() + timedelta(hours=24)
        
        story = UserStory.objects.create(
            user=request.user,
            caption=caption,
            media_data=media_data,
            bg_color=bg_color,
            expires_at=expires
        )
        return JsonResponse({'success': True, 'story_id': story.id})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

def api_get_stories(request):
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'error': 'Unauthorized'}, status=401)
    
    now = timezone.now()
    # Get user's accepted friends
    friend_ids_1 = list(Friendship.objects.filter(user=request.user, status='accepted').values_list('friend_id', flat=True))
    friend_ids_2 = list(Friendship.objects.filter(friend=request.user, status='accepted').values_list('user_id', flat=True))
    
    all_user_ids = set(friend_ids_1).union(set(friend_ids_2))
    all_user_ids.add(request.user.id)
    
    stories = UserStory.objects.filter(
        user_id__in=all_user_ids,
        expires_at__gt=now
    ).select_related('user').order_by('-created_at')
    
    results = []
    for s in stories:
        results.append({
            'id': s.id,
            'username': s.user.username,
            'display_name': s.user.display_name,
            'avatar_index': s.user.avatar_index,
            'caption': s.caption,
            'media_data': s.media_data,
            'bg_color': s.bg_color,
            'created_at': s.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'is_self': s.user.id == request.user.id
        })
        
    return JsonResponse({'success': True, 'stories': results})





