function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
    document.getElementById('auth-error').innerText = '';
}

function getCookie(name) {
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
const csrftoken = getCookie('csrftoken');

async function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/api/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({username: u, password: p})
        });
        const data = await response.json();
        
        if (data.success) {
            window.location.href = '/';
        } else {
            document.getElementById('auth-error-login').innerText = data.error;
        }
    } catch (err) {
        document.getElementById('auth-error-login').innerText = 'Connection error';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const u = document.getElementById('reg-username').value;
    const d = document.getElementById('reg-displayname').value;
    const p = document.getElementById('reg-password').value;
    const dob = document.getElementById('reg-dob').value;
    
    try {
        const response = await fetch('/api/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({username: u, display_name: d, password: p, date_of_birth: dob || null})
        });
        const data = await response.json();
        
        if (data.success) {
            window.location.href = '/';
        } else {
            document.getElementById('auth-error-reg').innerText = data.error;
        }
    } catch (err) {
        document.getElementById('auth-error-reg').innerText = 'Connection error';
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const u = document.getElementById('forgot-username').value;
    const dob = document.getElementById('forgot-dob').value;
    
    try {
        const response = await fetch('/api/forgot-password/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({username: u, date_of_birth: dob})
        });
        const data = await response.json();
        
        if (data.success) {
            toggleAuthMode('reset');
        } else {
            document.getElementById('auth-error-forgot').innerText = data.error;
        }
    } catch (err) {
        document.getElementById('auth-error-forgot').innerText = 'Connection error';
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    const newPassword = document.getElementById('reset-new-password').value;
    
    try {
        const response = await fetch('/api/reset-password/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({new_password: newPassword})
        });
        const data = await response.json();
        
        if (data.success) {
            alert('Password reset successful! You are now logged in.');
            window.location.href = '/';
        } else {
            document.getElementById('auth-error-reset').innerText = data.error;
        }
    } catch (err) {
        document.getElementById('auth-error-reset').innerText = 'Connection error';
    }
}
