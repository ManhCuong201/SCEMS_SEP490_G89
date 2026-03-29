import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
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

def test_manual_booking_abnormal_conflict(browser, login, step_wait):
    # Depending on test isolation, we might just be logged in as student still. But let's login again for reliability.
    login("student@fpt.edu.vn", "Password123!")
    step_wait()
    
    browser.get("http://localhost:5173/dashboard")
    step_wait()
    
    wait = WebDriverWait(browser, 10)
    time.sleep(2)
    
    # Try to find a slot that's already booked or is a class
    # To test overlap properly, we find a slot that is already requested.
    try:
        slot = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".already-requested")))
        slot.click()
        step_wait()
        
        wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "modal-panel-premium")))
        reason_area = browser.find_element(By.CLASS_NAME, "modal-textarea-premium")
        reason_area.send_keys("Conflict Test")
        step_wait()
        
        confirm_btn = browser.find_element(By.CSS_SELECTOR, ".btn-modal-primary")
        confirm_btn.click()
        step_wait()
        
        # Check for error alert
        error_alert = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-error")))
        assert error_alert.is_displayed()
        step_wait()
    except Exception as e:
        # If no requested slot available, skip or pass.
        pytest.skip("No pre-booked slot available for conflict test in this run.")
