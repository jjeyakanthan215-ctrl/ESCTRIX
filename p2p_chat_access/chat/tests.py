from django.test import TestCase
from django.contrib.auth import get_user_model
from chat.models import ChatMessage, ChatGroup, ChatGroupMember, ChatGroupMessage

User = get_user_model()

class ChatModelsTestCase(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='alice', password='Password123!')
        self.user2 = User.objects.create_user(username='bob', password='Password123!')

    def test_create_direct_message(self):
        msg = ChatMessage.objects.create(
            sender=self.user1,
            recipient=self.user2,
            encrypted_content='EncryptedPayload123'
        )
        self.assertEqual(msg.sender, self.user1)
        self.assertEqual(msg.recipient, self.user2)
        self.assertFalse(msg.is_read)

    def test_create_group_and_membership(self):
        group = ChatGroup.objects.create(name='Developers', created_by=self.user1)
        member1 = ChatGroupMember.objects.create(group=group, user=self.user1)
        member2 = ChatGroupMember.objects.create(group=group, user=self.user2)

        self.assertEqual(group.members.count(), 2)

        group_msg = ChatGroupMessage.objects.create(
            group=group,
            sender=self.user1,
            encrypted_content='GroupEncryptedPayload'
        )
        self.assertEqual(group_msg.group, group)
        self.assertEqual(group_msg.sender, self.user1)
