from django.contrib import admin
from .models import ChatMessage, PendingMessage, ChatGroup, ChatGroupMember, ChatGroupMessage, MessageReaction

class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'recipient', 'created_at', 'is_read', 'expires_at')
    search_fields = ('sender__username', 'recipient__username', 'encrypted_content')
    list_filter = ('is_read', 'created_at')

class PendingMessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'recipient', 'created_at')
    search_fields = ('sender__username', 'recipient__username', 'encrypted_content')

class ChatGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'created_at')
    search_fields = ('name', 'created_by__username')

class ChatGroupMemberAdmin(admin.ModelAdmin):
    list_display = ('group', 'user', 'joined_at')
    search_fields = ('group__name', 'user__username')

class ChatGroupMessageAdmin(admin.ModelAdmin):
    list_display = ('group', 'sender', 'created_at', 'expires_at')
    search_fields = ('group__name', 'sender__username', 'encrypted_content')

class MessageReactionAdmin(admin.ModelAdmin):
    list_display = ('message_type', 'message_id', 'user', 'emoji', 'created_at')
    search_fields = ('user__username', 'emoji')
    list_filter = ('message_type',)

admin.site.register(ChatMessage, ChatMessageAdmin)
admin.site.register(PendingMessage, PendingMessageAdmin)
admin.site.register(ChatGroup, ChatGroupAdmin)
admin.site.register(ChatGroupMember, ChatGroupMemberAdmin)
admin.site.register(ChatGroupMessage, ChatGroupMessageAdmin)
admin.site.register(MessageReaction, MessageReactionAdmin)

