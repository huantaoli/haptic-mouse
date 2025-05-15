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
chrome.storage.local.get(['connectedHIDDevices'], function (result) {
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

// Add hm-monitor functionality
function initHMMonitor() {
  // Haptic feedback intensity constants
  const HAPTIC_FEEDBACK = {
    SCROLL_CONTINUOUS: 20,    // 持续滚动时的轻微反馈
    DRAG_START_END: 30,      // 开始/结束拖拽时的反馈
    DRAG_CONTINUOUS: 30,     // 拖拽过程中的反馈
    SNAP_DETACH: 40,         // 从吸附区域脱离时的反馈
    BUTTON_CLICKED: 50,      // 普通按钮点击的反馈
    HOVER_WARNING: 60,       // 警告按钮悬停的反馈
    SCROLL_BOUNDARY: 80,     // 滚动到顶部/底部的强反馈
    SNAP_ATTACHED: 100,      // 元素吸附到目标区域的反馈
    WARNING_CLICKED: 120,    // 警告按钮点击的强反馈
    TEXT_SELECTED: 25        // 文本选择的轻微反馈
  };

  const monitoredElements = document.querySelectorAll("[data-hm-type]");

  monitoredElements.forEach(el => {
    // Check if element has already been initialized
    if (el.dataset.hmInitialized === 'true') {
      return;
    }

    const type = el.dataset.hmType;

    switch (type) {
      case "button": {
        el.addEventListener("click", () => {
          console.log("[hm-monitor] Button clicked:", el.textContent);
          sendHapticFeedback(HAPTIC_FEEDBACK.BUTTON_CLICKED);
        });
        // Mark element as initialized
        el.dataset.hmInitialized = 'true';
        break;
      }

      case "scroll": {
        const scrollElement = el;
        let lastScrollTop = scrollElement.scrollTop;
        let lastEmitTime = 0;
        let lastScrollPercentage = -1;
        let atTopEmitted = true;
        let atBottomEmitted = false;

        const throttleGap = 50; // ms: controls minimum output interval for "scrolling"

        setInterval(() => {
          const currentScrollTop = scrollElement.scrollTop;
          const scrollHeight = scrollElement.scrollHeight;
          const clientHeight = scrollElement.clientHeight;
          const scrollPercentage = Math.round((currentScrollTop / (scrollHeight - clientHeight)) * 100);

          // Detect "scrolling" with throttling
          if (Math.abs(currentScrollTop - lastScrollTop) > 1) {
            const now = Date.now();
            if (now - lastEmitTime > throttleGap) {
              console.log(`[hm-monitor] Scrolling... Current position: ${currentScrollTop}px, ${scrollPercentage}%`);
              sendHapticFeedback(HAPTIC_FEEDBACK.SCROLL_CONTINUOUS);
              lastEmitTime = now;
            }
            lastScrollTop = currentScrollTop;
          }

          // Detect if reached top (one-time output)
          if (scrollPercentage === 0 && !atTopEmitted) {
            console.log("[hm-monitor] Scrolled to top");
            sendHapticFeedback(HAPTIC_FEEDBACK.SCROLL_BOUNDARY);
            atTopEmitted = true;
          } else if (scrollPercentage > 0) {
            atTopEmitted = false;
          }

          // Detect if reached bottom (one-time output)
          if (scrollPercentage === 100 && !atBottomEmitted) {
            console.log("[hm-monitor] Scrolled to bottom");
            sendHapticFeedback(HAPTIC_FEEDBACK.SCROLL_BOUNDARY);
            atBottomEmitted = true;
          } else if (scrollPercentage < 100) {
            atBottomEmitted = false;
          }

          lastScrollPercentage = scrollPercentage;
        }, 50);

        // Mark element as initialized
        el.dataset.hmInitialized = 'true';
        break;
      }

      case "drag": {
        const drag = el;
        const snapAreas = document.querySelectorAll('[data-hm-type="snapArea"]');
        const threshold = 20;
        let lastSnapped = null;
        let isDragging = false;
        let isSnapping = false;

        function getCenter(el) {
          const rect = el.getBoundingClientRect();
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
        }

        function getDistance(p1, p2) {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          return Math.sqrt(dx * dx + dy * dy);
        }

        // Check snap areas
        function checkSnapping() {
          const dragCenter = getCenter(drag);
          let snappedTo = null;

          snapAreas.forEach(area => {
            const areaCenter = getCenter(area);
            const dist = getDistance(dragCenter, areaCenter);
            if (dist < threshold) {
              snappedTo = area.id || "Unnamed snap area";
            }
          });

          if (snappedTo && snappedTo !== lastSnapped) {
            isSnapping = true;
            console.log(`[hm-monitor] Plugin detected: Snapped to ${snappedTo}`);
            sendHapticFeedback(HAPTIC_FEEDBACK.SNAP_ATTACHED);
            lastSnapped = snappedTo;
          } else if (!snappedTo && lastSnapped !== null) {
            isSnapping = false;
            console.log(`[hm-monitor] Plugin detected: Detached from ${lastSnapped}`);
            sendHapticFeedback(HAPTIC_FEEDBACK.SNAP_DETACH);
            lastSnapped = null;
          }
        }

        // Don't interfere with dragging, only detect drag state
        drag.addEventListener("mousedown", () => {
          isDragging = true;
          console.log("[hm-monitor] Plugin detected: Start dragging");
          sendHapticFeedback(HAPTIC_FEEDBACK.DRAG_START_END);
        });

        document.addEventListener("mousemove", () => {
          if (isDragging) {
            checkSnapping();
          }
        });

        document.addEventListener("mouseup", () => {
          if (isDragging) {
            isDragging = false;
            console.log("[hm-monitor] Plugin detected: End dragging");
            sendHapticFeedback(HAPTIC_FEEDBACK.DRAG_START_END);
          }
        });

        // Check position change every 200ms
        let lastPosition = null;

        setInterval(() => {
          if (!document.body.contains(drag)) return;

          const currentPos = {
            x: drag.offsetLeft,
            y: drag.offsetTop
          };

          if (
            lastPosition &&
            (Math.abs(currentPos.x - lastPosition.x) > 0.5 ||
              Math.abs(currentPos.y - lastPosition.y) > 0.5)
          ) {
            if (!isSnapping) {
              sendHapticFeedback(HAPTIC_FEEDBACK.DRAG_CONTINUOUS);
              console.log("[hm-monitor] Plugin detected: Element moving");
            }
          }

          lastPosition = currentPos;
        }, 100);

        // Mark element as initialized
        el.dataset.hmInitialized = 'true';
        break;
      }

      case "warningButton": {
        el.addEventListener("click", () => {
          console.log("[hm-monitor] Warning button clicked");
          sendHapticFeedback(HAPTIC_FEEDBACK.WARNING_CLICKED);
        });
        el.addEventListener("mouseenter", () => {
          console.log("[hm-monitor] Hover on warning button");
          sendHapticFeedback(HAPTIC_FEEDBACK.HOVER_WARNING);
        });
        el.addEventListener("mouseleave", () => {
          console.log("[hm-monitor] Hover out from warning button");
        });
        // Mark element as initialized
        el.dataset.hmInitialized = 'true';
        break;
      }

      case "selectableText": {
        let lastSelected = "";

        const intervalId = setInterval(() => {
          if (!document.body.contains(el)) {
            // If element is removed, clear interval
            clearInterval(intervalId);
            return;
          }
          const selection = window.getSelection();
          const selectedText = selection ? selection.toString().trim() : "";

          // If text is not empty, and selection is within this element
          if (
            selectedText &&
            selection &&
            el.contains(selection.anchorNode) &&
            selectedText !== lastSelected
          ) {
            console.log("[hm-monitor] Text selected");
            sendHapticFeedback(HAPTIC_FEEDBACK.TEXT_SELECTED);
            lastSelected = selectedText;
          }

          // If selection is cleared (empty string), reset selection
          if (!selectedText && lastSelected !== "") {
            lastSelected = "";
          }
        }, 20);

        // Mark element as initialized
        el.dataset.hmInitialized = 'true';
        break;
      }
    }
  });
}

// Send haptic feedback to device
async function sendHapticFeedback(intensity) {
  try {
    if (!currentDevice || !currentDevice.opened) {
      console.log("[hm-monitor] No device connected, cannot send haptic feedback");
      return;
    }

    // Ensure intensity value is within valid range
    intensity = Math.max(0, Math.min(255, intensity));

    // Create report data
    const reportId = 0x10; // Report ID
    const data = new Uint8Array([intensity]);

    console.log(`[hm-monitor] Sending haptic feedback: intensity=${intensity}`);
    await currentDevice.sendReport(reportId, data);
  } catch (error) {
    console.error("[hm-monitor] Failed to send haptic feedback:", error);
  }
}

// Initialize monitoring after page load
document.addEventListener('DOMContentLoaded', () => {
  // Delay a bit to ensure all page elements are loaded
  setTimeout(initHMMonitor, 1000);
});

// Add MutationObserver to handle dynamically loaded elements
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      // Check for new elements with data-hm-type attribute
      setTimeout(initHMMonitor, 500);
    }
  });
});

// Start observing DOM changes
observer.observe(document.body, {
  childList: true,
  subtree: true
});