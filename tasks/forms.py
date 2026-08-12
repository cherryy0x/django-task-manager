from django import forms
from .models import Task


class TaskForm(forms.ModelForm):
    """
    Form for creating and updating Task instances.
    Includes custom widgets for styled inputs and date pickers.
    """
    class Meta:
        model = Task
        fields = ['title', 'description', 'due_date']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'e.g. Complete Django Project Documentation',
                'required': True,
                'autocomplete': 'off',
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Enter detailed notes, sub-tasks, or context...',
                'rows': 3,
            }),
            'due_date': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date',
                'required': True,
            }),
        }

    def clean_title(self):
        title = self.cleaned_data.get('title')
        if title:
            title = title.strip()
            if len(title) < 3:
                raise forms.ValidationError("Task title must be at least 3 characters long.")
        return title
