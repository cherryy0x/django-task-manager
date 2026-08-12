from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """
    Admin configuration for Task model.
    """
    list_display = ('title', 'due_date', 'is_completed', 'created_at')
    list_filter = ('is_completed', 'due_date', 'created_at')
    search_fields = ('title', 'description')
    ordering = ('is_completed', 'due_date')
    list_editable = ('is_completed',)
    date_hierarchy = 'due_date'
