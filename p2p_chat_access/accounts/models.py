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

    story_privacy = models.CharField(max_length=20, default='friends')

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

class GuestContactRequest(models.Model):
    ISSUE_CHOICES = [
        ('cant_login',       "Can't log in to my account"),
        ('forgot_password',  "Forgot my password"),
        ('account_banned',   "My account was suspended/banned"),
        ('account_hacked',   "I think my account was hacked"),
        ('privacy_concern',  "Privacy or data concern"),
        ('report_user',      "Report a user / abusive content"),
        ('technical_issue',  "Technical / app issue"),
        ('feature_request',  "Feature request or feedback"),
        ('other',            "Other"),
    ]
    STATUS_CHOICES = [
        ('new',     'New'),
        ('in_review', 'In Review'),
        ('resolved',  'Resolved'),
    ]
    name     = models.CharField(max_length=80, blank=True, default='Anonymous')
    email    = models.EmailField(blank=True, default='')
    issue    = models.CharField(max_length=40, choices=ISSUE_CHOICES, default='other')
    message  = models.TextField()
    status   = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.get_status_display()}] {self.get_issue_display()} — {self.name or 'Guest'}"

class UserStory(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='stories')
    caption = models.CharField(max_length=280, blank=True, default='')
    media_data = models.TextField(blank=True, default='')
    media_type = models.CharField(max_length=20, default='image') # text, image, video
    bg_color = models.CharField(max_length=20, default='#7c3aed')
    is_global = models.BooleanField(default=False)
    privacy = models.CharField(max_length=20, default='friends')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_active(self):
        return timezone.now() < self.expires_at

    def __str__(self):
        return f"Story by {self.user.username} (type: {self.media_type}, global: {self.is_global})"

class SystemBroadcast(models.Model):
    title = models.CharField(max_length=150, default="ESCTRIX System Update")
    message = models.TextField()
    category = models.CharField(max_length=50, default="System Update")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[ESCTRIX Official] {self.title} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
