/**
 * Database Seed Script
 * Create default departments and admin user
 */

require('dotenv').config();
const { sequelize, Department, User } = require('./models');

const defaultDepartments = [
  { name: 'IT', code: 'IT', description: 'Information Technology', network_range: '10.0.1.0/24' },
  { name: 'Keuangan', code: 'FINANCE', description: 'Finance Department', network_range: '10.0.2.0/24' },
  { name: 'Akuntansi', code: 'ACCOUNTING', description: 'Accounting Department', network_range: '10.0.3.0/24' },
  { name: 'HR', code: 'HR', description: 'Human Resources', network_range: '10.0.4.0/24' },
  { name: 'Marketing', code: 'MARKETING', description: 'Marketing Department', network_range: '10.0.5.0/24' },
  { name: 'Operations', code: 'OPS', description: 'Operations Department', network_range: '10.0.6.0/24' }
];

const seed = async () => {
  try {
    console.log('🌱 Starting database seed...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync models
    await sequelize.sync();
    console.log('✅ Database synchronized');

    // Create departments
    console.log('\n📁 Creating departments...');
    for (const dept of defaultDepartments) {
      const [department, created] = await Department.findOrCreate({
        where: { code: dept.code },
        defaults: dept
      });
      
      if (created) {
        console.log(`   ✅ Created: ${department.name} (${department.code})`);
      } else {
        console.log(`   ⏭️  Exists: ${department.name} (${department.code})`);
      }
    }

    // Create default admin user
    console.log('\n👤 Creating admin user...');
    const itDept = await Department.findOne({ where: { code: 'IT' } });
    
    const [admin, created] = await User.findOrCreate({
      where: { email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@vps-manager.local' },
      defaults: {
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@vps-manager.local',
        full_name: 'System Administrator',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!',
        role: 'super_admin',
        department_id: itDept?.id,
        is_active: true
      }
    });

    if (created) {
      console.log(`   ✅ Created admin: ${admin.email}`);
      console.log(`   📝 Default credentials:`);
      console.log(`      Email: ${admin.email}`);
      console.log(`      Password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!'}`);
      console.log(`   ⚠️  Please change the password after first login!`);
    } else {
      console.log(`   ⏭️  Admin exists: ${admin.email}`);
    }

    console.log('\n✅ Database seed completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - ${defaultDepartments.length} departments`);
    console.log(`   - 1 admin user`);
    console.log('\n🚀 You can now start the server with: npm start\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
