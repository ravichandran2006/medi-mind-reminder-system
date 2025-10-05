const twilio = require('twilio');

// Load environment variables
require('dotenv').config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function testSMS() {
  try {
    console.log('🔧 Testing Twilio SMS Configuration...');
    console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID);
    console.log('From Number:', process.env.TWILIO_PHONE_NUMBER);
    console.log('To Number: +919952608247');
    
    console.log('\n📱 Sending test SMS...');
    
    const message = await client.messages.create({
      body: '🏥 MediMate Test: Your aspirin reminder is working! Take 1 tablet now. Reply TAKEN when done. 💊',
      from: process.env.TWILIO_PHONE_NUMBER,
      to: '+919952608247'
    });
    
    console.log('✅ SMS Sent Successfully!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('Direction:', message.direction);
    
    // Check message status
    setTimeout(async () => {
      try {
        const messageStatus = await client.messages(message.sid).fetch();
        console.log('\n📊 Message Status Update:');
        console.log('Status:', messageStatus.status);
        console.log('Error Code:', messageStatus.errorCode);
        console.log('Error Message:', messageStatus.errorMessage);
        
        if (messageStatus.status === 'failed') {
          console.log('❌ SMS Failed. This is likely because +919952608247 is not verified in your Twilio account.');
          console.log('📋 Please verify your phone number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
        } else if (messageStatus.status === 'delivered') {
          console.log('🎉 SMS Successfully Delivered! Check your phone.');
        }
      } catch (statusError) {
        console.log('Error checking status:', statusError.message);
      }
    }, 3000);
    
  } catch (error) {
    console.log('❌ SMS Send Error:', error.message);
    if (error.code === 21614) {
      console.log('\n🔐 SOLUTION: Your phone number +919952608247 needs to be verified in Twilio console.');
      console.log('📋 Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      console.log('📱 Add +919952608247 and verify with SMS code');
    }
  }
}

testSMS();