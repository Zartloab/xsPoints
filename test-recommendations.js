const fetch = require('node-fetch');

async function testRecommendations() {
  try {
    console.log('Testing recommendations endpoint...');
    const response = await fetch('http://localhost:5000/api/recommendations/test');
    
    if (!response.ok) {
      console.error('Error response:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error body:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Recommendations received:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to test recommendations:', error);
  }
}

testRecommendations();
