// Store current connected device
let currentDevice = null;

// Disconnect device
async function disconnectDevice() {
  if (currentDevice && currentDevice.opened) {
    await currentDevice.close();
  }
  currentDevice = null;
  chrome.storage.local.remove('connectedHIDDevices');
  updateExtensionIcon(false);
  floatingButton.textContent = 'Connect HID Device';
  floatingButton.style.backgroundColor = '#2196F3';
}

// Update extension icon
function updateExtensionIcon(connected) {
  chrome.runtime.sendMessage({
    action: 'updateIcon',
    connected: connected
  });
}

// Create floating button
const floatingButton = document.createElement('button');
floatingButton.textContent = 'Connect HID Device';
floatingButton.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 10px 20px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  z-index: 9999;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: background-color 0.3s ease;
`;

// Add click event handler for HID device request
floatingButton.addEventListener('click', async () => {
  try {
    // If a device is already connected, disconnect it first
    if (currentDevice) {
      await disconnectDevice();
      return;
    }

    const devices = await navigator.hid.requestDevice({
      filters: [] // Empty array accepts all HID devices
    });
    
    if (devices.length > 0) {
      // Take only the first device
      const device = devices[0];
      
      // Try to open device connection
      await device.open();
      currentDevice = device;

      const deviceInfo = {
        productName: device.productName,
        vendorId: device.vendorId,
        productId: device.productId,
        manufacturerName: device.manufacturerName || 'Unknown Manufacturer'
      };
      
      // Store device info in chrome.storage
      chrome.storage.local.set({ 'connectedHIDDevices': [deviceInfo] });
      console.log('HID device connected:', deviceInfo);
      
      // Update icon to connected state
      updateExtensionIcon(true);
      
      // Update button text
      floatingButton.textContent = 'Disconnect HID Device';
      floatingButton.style.backgroundColor = '#45a049';
    }
  } catch (error) {
    console.error('HID device operation error:', error);
    await disconnectDevice();
  }
});

// Check for existing connected devices and set initial state
chrome.storage.local.get(['connectedHIDDevices'], function(result) {
  const hasConnectedDevices = result.connectedHIDDevices && result.connectedHIDDevices.length > 0;
  updateExtensionIcon(hasConnectedDevices);
  
  if (hasConnectedDevices) {
    floatingButton.textContent = 'Disconnect HID Device';
    floatingButton.style.backgroundColor = '#45a049';
  }
});

// Add button to page
document.body.appendChild(floatingButton);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'insertHTML') {
    const div = document.createElement('div');
    div.innerHTML = request.content;
    document.body.appendChild(div);
  }
});