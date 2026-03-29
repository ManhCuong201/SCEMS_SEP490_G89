import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os

def test_import_schedule_valid(browser, login, step_wait):
    # 1. Login as BookingStaff
    login("bookingstaff@fpt.edu.vn", "Password123!")
    step_wait()
    
    # 2. Navigate to Schedules Page
    browser.get("http://localhost:5173/admin/schedules")
    step_wait()
    
    # Wait for page load
    wait = WebDriverWait(browser, 10)
    time.sleep(2)
    
    # 3. Upload Excel file
    file_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']")))
    
    # Use the generated Valid_Import_Schedule.xlsx
    file_path = os.path.join(os.path.dirname(__file__), "Valid_Import_Schedule.xlsx")
    file_input.send_keys(file_path)
    step_wait()
    
    # 4. Verify success
    # It auto-submits on change, so wait for success alert
    try:
        success_msg = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-success")))
        assert success_msg.is_displayed()
        step_wait()
    except Exception as e:
        # Check for error alert explicitly if import fails
        error_msg = browser.find_elements(By.CLASS_NAME, "alert-error")
        if error_msg:
            print(f"Import failed with error: {error_msg[0].text}")
        raise e

def test_import_schedule_invalid(browser, login, step_wait):
    # Depending on test isolation, we might just be logged in still. But let's navigate to be sure.
    browser.get("http://localhost:5173/admin/schedules")
    step_wait()
    wait = WebDriverWait(browser, 10)
    time.sleep(2)
    
    file_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']")))
    
    # Use the generated Invalid_Import.txt
    file_path = os.path.join(os.path.dirname(__file__), "Invalid_Import.txt")
    file_input.send_keys(file_path)
    step_wait()
    
    # 5. Verify error
    try:
        error_msg = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-error")))
        assert error_msg.is_displayed()
        step_wait()
    except Exception as e:
        print("Expected an error alert but didn't find one")
        raise e
