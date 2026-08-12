/**
 * TaskMaster Pro - Vanilla JavaScript AJAX & Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    initFilterTabs();
});

/**
 * Helper function to retrieve CSRF token from cookies
 */
function getCsrfToken() {
    const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
    if (csrfInput) {
        return csrfInput.value;
    }
    
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * AJAX Function: Toggles completion status of a task without page reload
 * @param {number} taskId 
 */
async function toggleTaskComplete(taskId) {
    const btn = document.getElementById(`btn-complete-${taskId}`);
    const card = document.getElementById(`task-card-${taskId}`);
    const title = document.getElementById(`task-title-${taskId}`);
    const badge = document.getElementById(`task-badge-${taskId}`);

    if (!btn) return;

    // Save original inner HTML and set loading spinner state
    const originalBtnHtml = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Updating...`;
    btn.disabled = true;

    try {
        const response = await fetch(`/task/${taskId}/complete/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            // Update Card & Title Visual Styling
            if (data.is_completed) {
                card.classList.add('completed-card');
                card.setAttribute('data-status', 'completed');
                title.classList.add('completed-text');

                // Update Status Badge
                badge.className = 'status-badge badge-completed';
                badge.innerHTML = `<i class="fa-solid fa-check-double"></i> Completed`;

                // Update Button State
                btn.className = 'btn btn-sm btn-completed';
                btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Completed`;
            } else {
                card.classList.remove('completed-card');
                card.setAttribute('data-status', 'pending');
                title.classList.remove('completed-text');

                // Update Status Badge
                badge.className = 'status-badge badge-pending';
                badge.innerHTML = `<i class="fa-solid fa-spinner fa-spin-pulse"></i> Pending`;

                // Update Button State
                btn.className = 'btn btn-sm btn-complete';
                btn.innerHTML = `<i class="fa-solid fa-check"></i> Mark Complete`;
            }

            // Update Dashboard Statistics Counters dynamically
            if (data.stats) {
                updateStatCounters(data.stats);
            }

            // Trigger visual glow effect
            card.style.transition = 'all 0.3s ease';
            card.style.transform = 'scale(1.01)';
            setTimeout(() => {
                card.style.transform = 'scale(1)';
            }, 250);

            // Re-apply active tab filter to update list view if filtering
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) {
                filterTasks(activeTab.getAttribute('data-filter'));
            }

        } else {
            alert(data.error || 'Failed to update task status.');
            btn.innerHTML = originalBtnHtml;
        }
    } catch (error) {
        console.error('AJAX Error toggling task completion:', error);
        alert('An error occurred while connecting to the server. Please try again.');
        btn.innerHTML = originalBtnHtml;
    } finally {
        btn.disabled = false;
    }
}

/**
 * Updates summary statistics numbers and tab badge counts in real time
 * @param {Object} stats 
 */
function updateStatCounters(stats) {
    const elTotal = document.getElementById('stat-total');
    const elPending = document.getElementById('stat-pending');
    const elCompleted = document.getElementById('stat-completed');
    const elOverdue = document.getElementById('stat-overdue');

    const tabAll = document.getElementById('tab-count-all');
    const tabPending = document.getElementById('tab-count-pending');
    const tabCompleted = document.getElementById('tab-count-completed');

    if (elTotal) elTotal.textContent = stats.total;
    if (elPending) elPending.textContent = stats.pending;
    if (elCompleted) elCompleted.textContent = stats.completed;
    if (elOverdue) elOverdue.textContent = stats.overdue;

    if (tabAll) tabAll.textContent = stats.total;
    if (tabPending) tabPending.textContent = stats.pending;
    if (tabCompleted) tabCompleted.textContent = stats.completed;
}

/**
 * Filter Tabs Controller
 */
function initFilterTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filter = tab.getAttribute('data-filter');
            filterTasks(filter);
        });
    });
}

function filterTasks(filter) {
    const taskCards = document.querySelectorAll('.task-card');
    let visibleCount = 0;

    taskCards.forEach(card => {
        const status = card.getAttribute('data-status');
        if (filter === 'all' || status === filter) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const emptyState = document.getElementById('empty-state');
    if (emptyState) {
        if (visibleCount === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
    }
}

/**
 * AJAX Function: Deletes a task from the database and removes it from the UI without page reload
 * @param {number} taskId 
 */
async function deleteTask(taskId) {
    const card = document.getElementById(`task-card-${taskId}`);
    const deleteBtn = card ? card.querySelector('.btn-delete') : null;

    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Deleting...`;
    }

    try {
        const response = await fetch(`/task/${taskId}/delete/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            if (card) {
                card.classList.add('fade-out');
                setTimeout(() => {
                    card.remove();
                    
                    // Update dashboard statistics counters
                    if (data.stats) {
                        updateStatCounters(data.stats);
                    }

                    // Re-filter list view to show empty state if 0 tasks visible
                    const activeTab = document.querySelector('.tab-btn.active');
                    const activeFilter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
                    filterTasks(activeFilter);
                }, 300);
            }
        } else {
            alert(data.error || 'Failed to delete task.');
        }
    } catch (error) {
        console.error('AJAX Error deleting task:', error);
        alert('An error occurred while deleting the task. Please try again.');
    }
}
