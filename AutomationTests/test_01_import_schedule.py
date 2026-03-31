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

def test_import_schedule_conflict(browser, login, step_wait):
    # 1. Login as BookingStaff (ensures standalone execution works)
    login("bookingstaff@fpt.edu.vn", "Password123!")
    step_wait()

    # 2. Navigate to Schedules Page
    browser.get("http://localhost:5173/admin/schedules")
    step_wait()
    wait = WebDriverWait(browser, 10)
    time.sleep(2)
    
    file_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']")))
    
    # Use the generated Conflict_Import_Schedule.xlsx
    file_path = os.path.join(os.path.dirname(__file__), "Conflict_Import_Schedule.xlsx")
    file_input.send_keys(file_path)
    step_wait()
    
    # 5. Verify conflict error
    try:
        # Conflict error usually shows up in an error alert
        error_msg = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-error")))
        assert error_msg.is_displayed()
        assert "import completed with errors" in error_msg.text.lower()
        step_wait()
    except Exception as e:
        print("Expected a conflict error alert but didn't find one")
        raise e

def test_import_schedule_invalid_format(browser, login, step_wait):
    # 1. Login as BookingStaff
    login("bookingstaff@fpt.edu.vn", "Password123!")
    step_wait()

    # 2. Navigate to Schedules Page
    browser.get("http://localhost:5173/admin/schedules")
    step_wait()
    wait = WebDriverWait(browser, 10)
    time.sleep(2)
    
    # 3. Create a temporary invalid file
    invalid_file_path = os.path.join(os.path.dirname(__file__), "invalid_format.txt")
    with open(invalid_file_path, "w", encoding="utf-8") as f:
        f.write("This is not an Excel file.")
    
    try:
        # 4. Upload invalid file
        file_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file']")))
        file_input.send_keys(invalid_file_path)
        step_wait()
        
        # 5. Verify error alert
        error_msg = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-error")))
        actual_text = error_msg.text.lower()
        print(f"Format error received: {actual_text}")
        
        # Verify keywords
        assert any(k in actual_text for k in ["định dạng", "format", "không hợp lệ", "excel", "corrupted", "data", "file"])
        step_wait()
        
    finally:
        # 6. Cleanup
        if os.path.exists(invalid_file_path):
            os.remove(invalid_file_path)
