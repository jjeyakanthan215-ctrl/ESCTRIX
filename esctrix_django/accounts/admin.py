from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import CustomUser, Friendship, BlockList, HelpTicket, GuestContactRequest


# ─── ACTIONS ──────────────────────────────────────────────────

@admin.action(description="✖ Terminate / Deactivate selected accounts")
def terminate_accounts(modeladmin, request, queryset):
    queryset.update(is_active=False)

@admin.action(description="✔ Reactivate selected accounts")
def reactivate_accounts(modeladmin, request, queryset):
    queryset.update(is_active=True)

@admin.action(description="✔ Mark selected help tickets as Solved")
def mark_solved(modeladmin, request, queryset):
    queryset.update(status='solved')

@admin.action(description="⟳ Mark selected help tickets as Open")
def mark_open(modeladmin, request, queryset):
    queryset.update(status='open')

@admin.action(description="✔ Mark selected contact requests as Resolved")
def mark_resolved(modeladmin, request, queryset):
    queryset.update(status='resolved')

@admin.action(description="⟳ Mark selected contact requests as In Review")
def mark_in_review(modeladmin, request, queryset):
    queryset.update(status='in_review')


# ─── USER ADMIN ───────────────────────────────────────────────

class CustomUserAdmin(UserAdmin):
    list_display  = ('avatar_badge', 'username', 'display_name', 'account_status', 'is_staff', 'date_joined_short')
    list_display_links = ('username',)
    list_filter   = ('is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'display_name', 'email')
    ordering      = ('-date_joined',)
    actions       = [terminate_accounts, reactivate_accounts]
    list_per_page = 25

    fieldsets = UserAdmin.fieldsets + (
        ('ESCTRIX Profile', {
            'fields': ('display_name', 'bio', 'avatar_index', 'last_seen', 'date_of_birth')
        }),
    )

    @admin.display(description='Avatar')
    def avatar_badge(self, obj):
        url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={obj.avatar_index}"
        return format_html('<img src="{}" width="30" height="30" style="border-radius:50%;">', url)

    @admin.display(description='Status', ordering='is_active')
    def account_status(self, obj):
        if obj.is_active:
            return format_html('<span style="color:#4cd964;font-weight:700;">● Active</span>')
        return format_html('<span style="color:#ed4956;font-weight:700;">✖ Inactive</span>')

    @admin.display(description='Joined', ordering='date_joined')
    def date_joined_short(self, obj):
        return obj.date_joined.strftime('%d %b %Y')


# ─── FRIENDSHIP ADMIN ─────────────────────────────────────────

class FriendshipAdmin(admin.ModelAdmin):
    list_display  = ('user', 'friend', 'status_badge', 'created_at')
    list_filter   = ('status',)
    search_fields = ('user__username', 'friend__username')
    ordering      = ('-created_at',)
    list_per_page = 30

    @admin.display(description='Status', ordering='status')
    def status_badge(self, obj):
        colors = {'pending': '#fbbf24', 'accepted': '#4cd964', 'blocked': '#ed4956'}
        color = colors.get(obj.status, '#aaa')
        return format_html('<span style="color:{};font-weight:700;">● {}</span>', color, obj.get_status_display())


# ─── BLOCK LIST ADMIN ─────────────────────────────────────────

class BlockListAdmin(admin.ModelAdmin):
    list_display  = ('user', 'blocked_user', 'created_at')
    search_fields = ('user__username', 'blocked_user__username')
    ordering      = ('-created_at',)
    list_per_page = 30


# ─── HELP TICKET ADMIN ────────────────────────────────────────

class HelpTicketAdmin(admin.ModelAdmin):
    list_display  = ('user', 'subject', 'status_badge', 'created_at', 'updated_at')
    list_filter   = ('status', 'created_at')
    search_fields = ('user__username', 'subject', 'message')
    ordering      = ('-created_at',)
    actions       = [mark_solved, mark_open]
    list_per_page = 25
    readonly_fields = ('user', 'subject', 'message', 'created_at', 'updated_at')

    @admin.display(description='Status', ordering='status')
    def status_badge(self, obj):
        if obj.status == 'solved':
            return format_html('<span style="color:#4cd964;font-weight:700;">✔ Solved</span>')
        return format_html('<span style="color:#fbbf24;font-weight:700;">● Open</span>')


# ─── GUEST CONTACT REQUEST ADMIN ──────────────────────────────

class GuestContactAdmin(admin.ModelAdmin):
    list_display  = ('name_or_guest', 'issue_label', 'email_display', 'status_badge', 'created_at')
    list_filter   = ('status', 'issue', 'created_at')
    search_fields = ('name', 'email', 'message')
    ordering      = ('-created_at',)
    actions       = [mark_resolved, mark_in_review]
    list_per_page = 25
    readonly_fields = ('name', 'email', 'issue', 'message', 'created_at')

    @admin.display(description='Name')
    def name_or_guest(self, obj):
        return obj.name or format_html('<span style="color:rgba(255,255,255,0.35);">Anonymous</span>')

    @admin.display(description='Issue')
    def issue_label(self, obj):
        return obj.get_issue_display()

    @admin.display(description='Email')
    def email_display(self, obj):
        if obj.email:
            return obj.email
        return format_html('<span style="color:rgba(255,255,255,0.28);">—</span>')

    @admin.display(description='Status', ordering='status')
    def status_badge(self, obj):
        styles = {
            'new':       ('<span style="color:#a78bfa;font-weight:700;">🆕 New</span>',),
            'in_review': ('<span style="color:#fbbf24;font-weight:700;">⟳ In Review</span>',),
            'resolved':  ('<span style="color:#4cd964;font-weight:700;">✔ Resolved</span>',),
        }
        html = styles.get(obj.status, ('<span>Unknown</span>',))[0]
        return format_html(html)


# ─── REGISTER ─────────────────────────────────────────────────

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Friendship, FriendshipAdmin)
admin.site.register(BlockList, BlockListAdmin)
admin.site.register(HelpTicket, HelpTicketAdmin)
admin.site.register(GuestContactRequest, GuestContactAdmin)
