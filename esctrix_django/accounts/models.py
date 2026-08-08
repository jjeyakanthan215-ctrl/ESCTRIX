from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class CustomUser(AbstractUser):
    # AbstractUser already provides: username, password, date_joined, last_login, etc.
    display_name = models.CharField(max_length=50)
    bio = models.TextField(blank=True, default="")
    avatar_index = models.IntegerField(default=0)
    last_seen = models.DateTimeField(default=timezone.now)
    username_last_changed = models.DateTimeField(null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.username

class Friendship(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('blocked', 'Blocked'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='friendships_initiated')
    friend = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='friendships_received')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'friend')

    def __str__(self):
        return f"{self.user.username} -> {self.friend.username} ({self.status})"

class BlockList(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='blocking')
    blocked_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='blocked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'blocked_user')

    def __str__(self):
        return f"{self.user.username} blocked {self.blocked_user.username}"

class HelpTicket(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('solved', 'Solved'),
    ]
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='help_tickets')
    subject = models.CharField(max_length=150)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.subject} ({self.status})"

