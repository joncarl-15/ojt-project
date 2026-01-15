
const API_URL = 'http://localhost:5000/api/auth/register';

const testUser = {
    firstName: 'Test',
    lastName: 'User',
    userName: `testuser_${Date.now()}`,
    email: `testuser_${Date.now()}@example.com`,
    password: 'password123',
    role: 'student',
    program: 'bsit'
};

async function verifyRegistration() {
    try {
        console.log('Attempting to register user:', testUser);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Registration failed:', data);
        } else {
            console.log('Registration successful:', data);
        }
    } catch (error: any) {
        console.error('Registration error:', error.message);
    }
}

verifyRegistration();
