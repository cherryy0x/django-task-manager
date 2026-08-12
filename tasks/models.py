from django.db import models
from django.utils import timezone


class Task(models.Model):
    """
    Task Model representing an individual task in the system.
    """
    title = models.CharField(max_length=200, help_text="Title of the task")
    description = models.TextField(blank=True, help_text="Detailed task description")
    due_date = models.DateField(help_text="Target completion date")
    is_completed = models.BooleanField(default=False, help_text="Status indicator")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['is_completed', 'due_date', '-created_at']
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'

    def __str__(self):
        return self.title

    @property
    def is_overdue(self):
        """Returns True if task is pending and due date has passed."""
        if not self.is_completed and self.due_date:
            return self.due_date < timezone.now().date()
        return False
