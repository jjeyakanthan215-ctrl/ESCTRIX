from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Friendship, BlockList, HelpTicket

# Action to terminate user accounts (mark as inactive)
@admin.action(description="Terminate / Deactivate selected user accounts")
def terminate_accounts(modeladmin, request, queryset):
    queryset.update(is_active=False)

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'display_name', 'email', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'display_name', 'email')
    actions = [terminate_accounts]
    
    # Expose custom fields in admin detail page
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('display_name', 'bio', 'avatar_index', 'last_seen', 'date_of_birth')}),
    )

class FriendshipAdmin(admin.ModelAdmin):
    list_display = ('user', 'friend', 'status', 'created_at', 'updated_at')
    list_filter = ('status',)
    search_fields = ('user__username', 'friend__username')

class BlockListAdmin(admin.ModelAdmin):
    list_display = ('user', 'blocked_user', 'created_at')
    search_fields = ('user__username', 'blocked_user__username')

@admin.action(description="Mark selected tickets as Solved")
def mark_solved(modeladmin, request, queryset):
    queryset.update(status='solved')

class HelpTicketAdmin(admin.ModelAdmin):
    list_display = ('user', 'subject', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'subject', 'message')
    actions = [mark_solved]

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Friendship, FriendshipAdmin)
admin.site.register(BlockList, BlockListAdmin)
admin.site.register(HelpTicket, HelpTicketAdmin)

