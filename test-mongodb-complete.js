// Script to test the complete MongoDB data storage
import fetch from 'node-fetch';

async function testCompleteMongoDBStorage() {
  try {
    console.log('Testing complete MongoDB data storage...');
    
    const response = await fetch('http://localhost:5000/api/mongodb-test/complete-user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // No need to provide data as the endpoint has defaults
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error (${response.status}): ${errorText}`);
      return;
    }
    
    const data = await response.json();
    console.log('Successfully created complete data in MongoDB:');
    console.log('User ID:', data.user.id);
    console.log('Username:', data.user.username);
    console.log('Credit Cards:', data.creditCards.map(card => card.cardName).join(', '));
    console.log('Financial Profile ID:', data.financialProfile.id);
    
    console.log('\nTo check the data in MongoDB, run:');
    console.log('MONGODB_URI=mongodb://localhost:27017/replitcc node check-mongodb.js');
  } catch (error) {
    console.error('Error testing MongoDB storage:', error);
  }
}

// Run the test
testCompleteMongoDBStorage(); 