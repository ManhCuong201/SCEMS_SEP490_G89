import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time

def test_manual_booking_normal_flow(browser, login, step_wait):
    # 1. Login as Student
    login("student@fpt.edu.vn", "Password123!")
    step_wait()
    
    # 2. Navigate to Dashboard/Scheduler
    browser.get("http://localhost:5173/dashboard")
    step_wait()
    
    # 3. Change date to tomorrow
    from datetime import datetime, timedelta
    from selenium.webdriver.common.keys import Keys
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%m%d%Y')
    date_input = browser.find_element(By.CSS_SELECTOR, "input[type='date']")
    date_input.click() # Focus the input
    date_input.send_keys(tomorrow)
    step_wait()
    
    # 4. Find an available slot
    wait = WebDriverWait(browser, 10)
    # Give it time to load data
    time.sleep(2)
    slot = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".slot-available")))
    slot.click()
    step_wait()
    
    # 5. Fill booking modal
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "modal-panel-premium")))
    reason_area = browser.find_element(By.CLASS_NAME, "modal-textarea-premium")
    reason_area.send_keys("Selenium Automation Test Booking - Happy Path")
    step_wait()
    
    # 5. Confirm booking
    confirm_btn = browser.find_element(By.CSS_SELECTOR, ".btn-modal-primary")
    confirm_btn.click()
    step_wait()
    
    # 6. Verify success
    try:
        success_alert = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-success")))
    except TimeoutException:
        # Check for error alert
        try:
            error_alert = browser.find_element(By.CLASS_NAME, "alert-error")
            print(f"Booking failed with error: {error_alert.text}")
        except:
            print(f"Booking failed. Current URL: {browser.current_url}")
        raise
    actual_text = success_alert.text.lower()
    assert "đã gửi yêu cầu" in actual_text or "thành công" in actual_text
    step_wait()

    # 7. Staff Approval
    # Login as BookingStaff
    login("bookingstaff@fpt.edu.vn", "Password123!")
    step_wait()
    
    browser.get("http://localhost:5173/admin/bookings")
    step_wait()
    
    # Click the first 'Duyệt' (Approve) button
    # In BookingManagementPage.tsx, it's a button with text 'Duyệt'
    approve_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Duyệt')]")))
    approve_btn.click()
    step_wait()
    
    # Wait for success alert
    success_msg = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-success")))
    assert "thành công" in success_msg.text.lower()
    step_wait()

    # 8. Notification Check
    # Login back as Student
    login("student@fpt.edu.vn", "Password123!")
    step_wait()
    
    # Wait for notification bell
    # Using a more robust selector based on the provided HTML structure
    bell_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button:has(svg.lucide-bell)")))
    bell_btn.click()
    step_wait()
    
    # 9. Verify Notification Content
    # Notification list is an 'ul' with 'li' items
    try:
        # Check for a notification that contains 'đã được phê duyệt' (exact wording)
        notification_list = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".glass-card ul")))
        notifications = notification_list.find_elements(By.TAG_NAME, "li")
        
        found = False
        # The user specifically wants to make sure the LATEST notification says 'đã được phê duyệt'
        # We'll check the first item specifically
        latest_text = notifications[0].text.lower()
        print(f"Latest notification text: {latest_text}")
        
        if "đã được phê duyệt" in latest_text:
            found = True
        
        assert found, f"Approval notification ('đã được phê duyệt') not found in the latest item. Found: {latest_text}"
        step_wait()
    except Exception as e:
        print(f"Notification check failed: {e}")
        raise e

def test_manual_booking_abnormal_conflict(browser, login, step_wait):
    # 1. Login as Lecturer
    login("lecturer@fpt.edu.vn", "Password123!")
    step_wait()
    
    browser.get("http://localhost:5173/dashboard")
    step_wait()
    
    wait = WebDriverWait(browser, 10)
    time.sleep(2)
    
    # 2. Set date to 06/04/2026 (a day where the lecturer has a class)
    # Note: Using mm/dd/yyyy format for the date input
    date_input = browser.find_element(By.CSS_SELECTOR, "input[type='date']")
    date_input.clear()
    date_input.send_keys("04062026")
    step_wait()
    
    # Wait for grid to update
    time.sleep(3)
    
    # 3. Try to book a room at 7:00 AM (Slot 1)
    # We find any available slot at 7:00 AM. 
    # In the grid, 7:00 AM is usually the first slot column for each room.
    try:
        # We look for a slot that is available but should conflict with the lecturer's own schedule
        # The first available slot we find after the date change
        slot = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".slot-available")))
        slot.click()
        step_wait()
        
        wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "modal-panel-premium")))
        reason_area = browser.find_element(By.CLASS_NAME, "modal-textarea-premium")
        reason_area.send_keys("Attempting to book during my own class time")
        step_wait()
        
        confirm_btn = browser.find_element(By.CSS_SELECTOR, ".btn-modal-primary")
        confirm_btn.click()
        step_wait()
        
        # 4. Verify conflict error
        error_alert = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-error")))
        assert error_alert.is_displayed()
        # The error should mention the lecturer is busy
        assert "giảng viên" in error_alert.text.lower() or "đã có lịch" in error_alert.text.lower()
        step_wait()
    except Exception as e:
        print(f"Abnormal conflict test failed or no slot found: {e}")
        raise e

def test_manual_booking_rejection_flow(browser, login, step_wait):
    # 1. Student Request
    login("student@fpt.edu.vn", "Password123!")
    step_wait()
    
    browser.get("http://localhost:5173/dashboard")
    step_wait()
    
    # Set date to day after tomorrow
    from datetime import datetime, timedelta
    day_after_tomorrow = (datetime.now() + timedelta(days=2)).strftime('%m%d%Y')
    date_input = browser.find_element(By.CSS_SELECTOR, "input[type='date']")
    date_input.click()
    date_input.send_keys(day_after_tomorrow)
    step_wait()
    
    wait = WebDriverWait(browser, 10)
    time.sleep(2)
    slot = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".slot-available")))
    slot.click()
    step_wait()
    
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "modal-panel-premium")))
    reason_area = browser.find_element(By.CLASS_NAME, "modal-textarea-premium")
    reason_area.send_keys("Selenium Request for Rejection Test - " + day_after_tomorrow)
    step_wait()
    
    confirm_btn = browser.find_element(By.CSS_SELECTOR, ".btn-modal-primary")
    confirm_btn.click()
    step_wait()
    
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-success")))
    step_wait()

    # 2. Staff Rejection
    # Login as BookingStaff
    login("bookingstaff@fpt.edu.vn", "Password123!")
    step_wait()
    
    browser.get("http://localhost:5173/admin/bookings")
    step_wait()
    
    # Click 'Từ chối' (Reject) button
    # Using the pattern from test_02: broad text or class match
    reject_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Từ chối') or contains(@class, 'btn-error')]")))
    reject_btn.click()
    step_wait()
    
    # ConfirmModal appears
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "glass-panel")))
    textarea = wait.until(EC.visibility_of_element_located((By.TAG_NAME, "textarea")))
    rejection_reason = "Bận lịch đột xuất - Kiểm định chất lượng " + day_after_tomorrow
    textarea.send_keys(rejection_reason)
    step_wait()
    
    # Click confirm rejection button (it also says 'Từ chối' inside the modal)
    # Using the pattern from test_02: exact text or danger class
    modal_confirm_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Từ chối' or contains(@class, 'btn-danger')]")))
    modal_confirm_btn.click()
    step_wait()
    
    # Verify success alert
    success_msg = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-success")))
    assert "từ chối" in success_msg.text.lower()
    step_wait()
    # Wait for background notification processing
    time.sleep(2)

    # 3. Student Notification Verification
    # Login back as Student
    login("student@fpt.edu.vn", "Password123!")
    step_wait()
    
    # Open notification menu
    bell_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button:has(svg.lucide-bell)")))
    bell_btn.click()
    step_wait()
    
    # 4. Click Notification & Verify Reason on My Bookings Page
    try:
        # Wait specifically for the glass-card notification list
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".glass-card ul li")))
        notification_list = browser.find_element(By.CSS_SELECTOR, ".glass-card ul")
        notifications = notification_list.find_elements(By.TAG_NAME, "li")
        
        # Click the LATEST notification (the one we just got)
        # It's at index 0. We'll click the list item itself
        notifications[0].click()
        step_wait()
        
        # Navigation should occur to /my-bookings
        wait.until(EC.url_contains("/my-bookings"))
        
        # Wait for the bookings table to load
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "table.glass-table")))
        
        # Verify rejection reason in the table
        # We can search the whole table text for the specific reason
        table_text = browser.find_element(By.CSS_SELECTOR, "table.glass-table").text.lower()
        print(f"My Bookings Table text: {table_text}")
        
        assert "đã từ chối" in table_text or "đã bị từ chối" in table_text, "Status 'Đã từ chối' not found in table"
        assert "kiểm định chất lượng" in table_text, f"Rejection reason '{rejection_reason}' not found in table"
        step_wait()
    except Exception as e:
        print(f"Rejection flow verification failed: {e}")
        raise e

def test_manual_booking_cancellation_flow(browser, login, step_wait):
    # 1. Student Request
    login("student@fpt.edu.vn", "Password123!")
    step_wait()
    
    browser.get("http://localhost:5173/dashboard")
    step_wait()
    
    # Set date to 3 days from now
    from datetime import datetime, timedelta
    date_val = (datetime.now() + timedelta(days=3)).strftime('%m%d%Y')
    date_input = browser.find_element(By.CSS_SELECTOR, "input[type='date']")
    date_input.click()
    date_input.send_keys(date_val)
    step_wait()
    
    wait = WebDriverWait(browser, 10)
    time.sleep(2)
    slot = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".slot-available")))
    slot.click()
    step_wait()
    
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "modal-panel-premium")))
    reason_area = browser.find_element(By.CLASS_NAME, "modal-textarea-premium")
    unique_reason = "Selenium Cancellation Test - " + date_val
    reason_area.send_keys(unique_reason)
    step_wait()
    
    confirm_btn = browser.find_element(By.CSS_SELECTOR, ".btn-modal-primary")
    confirm_btn.click()
    step_wait()
    
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-success")))
    step_wait()

    # 2. Navigate to My Bookings
    browser.get("http://localhost:5173/my-bookings")
    step_wait()
    
    # 3. Locate and Cancel the request
    try:
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "table.glass-table")))
        
        # Find the row containing our unique reason
        row_xpath = f"//tr[contains(., '{unique_reason}')]"
        row = wait.until(EC.visibility_of_element_located((By.XPATH, row_xpath)))
        
        # Click the 'Huỷ' (Cancel) button in that row
        # Selector based on UserBookingsPage: btn-outline with XCircle icon text 'Huỷ'
        cancel_btn = row.find_element(By.XPATH, ".//button[contains(., 'Huỷ')]")
        cancel_btn.click()
        step_wait()
        
        # 4. Confirm in Modal
        # Modal title: Xác nhận huỷ yêu cầu
        wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "glass-panel")))
        # 7. Confirm cancellation in modal
        # The button text in the modal is 'Xác nhận huỷ', and it's inside a 'glass-panel'
        confirm_cancel_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[contains(@class, 'glass-panel')]//button[contains(text(), 'Xác nhận huỷ')]")))
        confirm_cancel_btn.click()
        step_wait()
        
        # 5. Verify success alert
        # Supporting both custom alert-success and react-hot-toast (role='status')
        success_msg = wait.until(EC.visibility_of_element_located((By.XPATH, "//*[contains(@class, 'alert-success') or @role='status' or contains(text(), 'thành công')]")))
        assert "thành công" in success_msg.text.lower()
        step_wait()
        
        # Optional: verify status updated in table
        # We re-fetch breadcrumb/table or check cell
        time.sleep(2)
        row = browser.find_element(By.XPATH, row_xpath)
        assert "huỷ" in row.text.lower() or "chờ" not in row.text.lower()
        
    except Exception as e:
        print(f"Cancellation flow verification failed: {e}")
        raise e
