from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST
from django.contrib import messages
from django.utils import timezone
import json

from .models import Task
from .forms import TaskForm


def get_task_stats():
    """Helper function to calculate current task metrics."""
    all_tasks = Task.objects.all()
    total = all_tasks.count()
    completed = all_tasks.filter(is_completed=True).count()
    pending = total - completed
    overdue = all_tasks.filter(is_completed=False, due_date__lt=timezone.now().date()).count()
    return {
        'total': total,
        'completed': completed,
        'pending': pending,
        'overdue': overdue,
    }


def task_list(request):
    """
    Main View: Displays all tasks, summary statistics cards, 
    and handles task creation form submission.
    """
    tasks = Task.objects.all()
    form = TaskForm()

    if request.method == 'POST':
        form = TaskForm(request.POST)
        if form.is_valid():
            task = form.save()
            messages.success(request, f'Task "{task.title}" created successfully!')
            return redirect('task_list')
        else:
            messages.error(request, 'Please correct the errors in the form below.')

    stats = get_task_stats()
    context = {
        'tasks': tasks,
        'form': form,
        'stats': stats,
        'today': timezone.now().date(),
    }
    return render(request, 'tasks/task_list.html', context)


@require_POST
def toggle_complete(request, pk):
    """
    AJAX Endpoint: Toggles the completion status of a task asynchronously.
    Responds with JSON containing updated task state and overall metrics.
    """
    try:
        task = get_object_or_404(Task, pk=pk)
        
        # Toggle completion status (or set to completed)
        task.is_completed = not task.is_completed
        task.save()

        stats = get_task_stats()

        return JsonResponse({
            'success': True,
            'task_id': task.id,
            'title': task.title,
            'is_completed': task.is_completed,
            'status_label': 'Completed' if task.is_completed else 'Pending',
            'message': f'Task "{task.title}" updated to {"Completed" if task.is_completed else "Pending"}.',
            'stats': stats,
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@require_POST
def task_delete(request, pk):
    """
    View to delete a task from the database.
    Supports both traditional POST redirect and AJAX request.
    """
    task = get_object_or_404(Task, pk=pk)
    task_title = task.title
    task.delete()

    # If AJAX request
    if request.headers.get('x-requested-with') == 'XMLHttpRequest' or 'application/json' in request.headers.get('Accept', ''):
        stats = get_task_stats()
        return JsonResponse({
            'success': True,
            'task_id': pk,
            'message': f'Task "{task_title}" was deleted.',
            'stats': stats,
        })

    messages.success(request, f'Task "{task_title}" deleted successfully.')
    return redirect('task_list')
