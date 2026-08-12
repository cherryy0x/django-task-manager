from django.urls import path
from . import views

urlpatterns = [
    path('', views.task_list, name='task_list'),
    path('task/<int:pk>/complete/', views.toggle_complete, name='toggle_complete'),
    path('task/<int:pk>/delete/', views.task_delete, name='task_delete'),
]
