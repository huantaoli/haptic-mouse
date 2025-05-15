// 获取并显示设备信息
function updateDeviceList() {
  chrome.storage.local.get(['connectedHIDDevices'], function(result) {
    const deviceList = document.getElementById('deviceList');
    const devices = result.connectedHIDDevices;
    
    if (devices && devices.length > 0) {
      deviceList.innerHTML = devices.map(device => `
        <div class="device-item">
          <div>${device.productName || '未知设备'}</div>
          <div>厂商ID: <span style="color: #0366d6">${device.vendorId}</span></div>
          <div>产品ID: <span style="color: #0366d6">${device.productId}</span></div>
          <div>制造商: ${device.manufacturerName || '未知制造商'}</div>
        </div>
      `).join('');
    } else {
      deviceList.innerHTML = '';
    }
  });
}

// 页面加载时更新设备列表
document.addEventListener('DOMContentLoaded', updateDeviceList);

// 每秒更新一次设备列表
setInterval(updateDeviceList, 1000);