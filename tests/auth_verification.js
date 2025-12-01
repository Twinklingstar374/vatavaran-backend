import axios from 'axios';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);
const BASE_URL = 'http://localhost:4000/api/auth';

// Helper to run shell commands
async function runCommand(command) {
  try {
    const { stdout, stderr } = await execPromise(command);
    return stdout;
  } catch (error) {
    console.error(`Error running command: ${command}`, error.message);
    throw error;
  }
}

async function testAuthRefinement() {
  console.log('--- Starting Auth Verification ---');

  // 1. Test Public Signup (Should be STAFF)
  console.log('\n1. Testing Public Signup...');
  try {
    const res = await axios.post(`${BASE_URL}/signup`, {
      name: 'Test Staff',
      email: `staff_${Date.now()}@test.com`,
      password: 'password123',
      role: 'ADMIN' // Attempt to inject ADMIN role
    });
    
    if (res.data.user.role === 'STAFF') {
      console.log('✅ Public signup correctly ignored role injection and assigned STAFF.');
    } else {
      console.error('❌ Public signup failed: Role was not STAFF.', res.data.user);
    }
  } catch (error) {
    console.error('❌ Public signup error:', error.response?.data || error.message);
  }

  // 2. Test Admin Seed Script
  console.log('\n2. Testing Admin Seed Script...');
  try {
    // Set env vars for test
    process.env.ADMIN_NAME = 'Test Admin';
    process.env.ADMIN_EMAIL = `admin_${Date.now()}@test.com`;
    process.env.ADMIN_PASSWORD = 'adminpassword';
    
    // Run script
    await runCommand('node scripts/create-admin.js');
    
    // Login as Admin to verify
    const loginRes = await axios.post(`${BASE_URL}/login`, {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    });

    const adminToken = loginRes.data.token;
    console.log('✅ Admin seed script worked. Admin logged in successfully.');

    // 3. Test Create User (Admin Only)
    console.log('\n3. Testing Admin Create User...');
    try {
      const createRes = await axios.post(`${BASE_URL}/create-user`, {
        name: 'Test Supervisor',
        email: `supervisor_${Date.now()}@test.com`,
        password: 'password123',
        role: 'SUPERVISOR'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (createRes.data.user.role === 'SUPERVISOR') {
        console.log('✅ Admin successfully created a SUPERVISOR.');
      } else {
        console.error('❌ Admin create user failed.', createRes.data);
      }
    } catch (error) {
      console.error('❌ Admin create user error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Admin seed/login error:', error.message);
  }
}

testAuthRefinement();
