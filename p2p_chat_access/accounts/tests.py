from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse

User = get_user_model()

class AccountsAuthTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user_password = 'TestPassword123!'
        self.user = User.objects.create_user(
            username='testuser',
            password=self.user_password,
            date_of_birth='2000-01-01'
        )

    def test_auth_page_renders(self):
        response = self.client.get(reverse('auth'))
        self.assertEqual(response.status_code, 200)

    def test_successful_api_login(self):
        response = self.client.post(
            reverse('api_login'),
            content_type='application/json',
            data={
                'username': 'testuser',
                'password': self.user_password,
            }
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json().get('success'))

    def test_check_username_availability_taken(self):
        response = self.client.get(reverse('api_check_username'), {'username': 'testuser'})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json().get('available'))

    def test_check_username_availability_available(self):
        response = self.client.get(reverse('api_check_username'), {'username': 'newuser123'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json().get('available'))
