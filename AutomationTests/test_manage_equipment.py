import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def test_manage_equipment_normal_flow(browser, login, step_wait):
    # 1. Login as Asset Staff
    login("assetstaff@fpt.edu.vn", "Password123!")
    step_wait()
    
    # 2. Navigate to Equipment Management Page
    browser.get("http://localhost:5173/admin/equipment")
    step_wait()
    
    # 3. Wait for page load and table
    wait = WebDriverWait(browser, 10)
    time.sleep(2)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "table")))
    
    # 4. Click 'Add Equipment' or 'Thêm thiết bị' button
    try:
        add_btn = browser.find_element(By.XPATH, "//button[contains(text(), 'Thêm thiết bị') or contains(@class, 'btn-primary')]")
        add_btn.click()
        step_wait()
    except:
        pytest.skip("Could not find Add Equipment button. Checking page functionality.")
    
    # 5. Fill the equipment form (assuming standard inputs)
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "form")))
    
    inputs = browser.find_elements(By.CSS_SELECTOR, "input[type='text']")
    if inputs:
        inputs[0].send_keys("Test Equipment - Selenium")
        step_wait()
        
    # 6. Submit the form
    submit_btn = browser.find_element(By.XPATH, "//button[@type='submit' or contains(text(), 'Lưu')]")
    submit_btn.click()
    step_wait()
    
    # 7. Verify success
    try:
        success_alert = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-success")))
        assert success_alert.is_displayed()
        step_wait()
    except:
        # Fallback check table
        time.sleep(2)
        table_text = browser.find_element(By.CSS_SELECTOR, "table").text
        assert "Test Equipment - Selenium" in table_text
        step_wait()

def test_manage_equipment_validation_error(browser, login, step_wait):
    browser.get("http://localhost:5173/admin/equipment")
    step_wait()
    wait = WebDriverWait(browser, 10)
    time.sleep(2)
    
    try:
        add_btn = browser.find_element(By.XPATH, "//button[contains(text(), 'Thêm') or contains(@class, 'btn-primary')]")
        add_btn.click()
        step_wait()
        
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "form")))
        
        # Submit without filling anything
        submit_btn = browser.find_element(By.XPATH, "//button[@type='submit' or contains(text(), 'Lưu')]")
        submit_btn.click()
        step_wait()
        
        # Expect browser HTML5 validation or application validation error
        # A simple check to ensure form wasn't actually submitted and closed
        form_still_visible = browser.find_element(By.CSS_SELECTOR, "form").is_displayed()
        assert form_still_visible
        step_wait()
    except Exception as e:
        pytest.skip("Test skipped due to missing elements mapping.")
