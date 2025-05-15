// Get and display device information
function updateDeviceList() {
  chrome.storage.local.get(['connectedHIDDevices'], function (result) {
    const deviceList = document.getElementById('deviceList');
    const devices = result.connectedHIDDevices;

    if (devices && devices.length > 0) {
      deviceList.innerHTML = devices.map(device => `
        <div class="device-item">
          <div>${device.productName || 'Unknown Device'}</div>
          <div>Vendor ID: <span style="color: #0366d6">${device.vendorId}</span></div>
          <div>Product ID: <span style="color: #0366d6">${device.productId}</span></div>
          <div>Manufacturer: ${device.manufacturerName || 'Unknown Manufacturer'}</div>
        </div>
      `).join('');
    } else {
      deviceList.innerHTML = '';
    }
  });
}

// Update device list when page loads
document.addEventListener('DOMContentLoaded', updateDeviceList);

// Update device list every second
setInterval(updateDeviceList, 1000);