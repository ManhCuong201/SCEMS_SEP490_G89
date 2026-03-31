import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
import time

def test_manage_equipment_normal_flow(browser, login, step_wait):
    # 1. Login as Asset Staff
    login("assetstaff@fpt.edu.vn", "Password123!")
    step_wait()
    
    # 2. Navigate to Equipment Management Page
    browser.get("http://localhost:5173/admin/equipment")
    step_wait()
    
    wait = WebDriverWait(browser, 10)
    time.sleep(2)
    
    unique_name = f"Selenium Item {time.time()}"
    
    # 3. Add Equipment
    add_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a.btn-primary[href*='create']")))
    add_btn.click()
    step_wait()
    
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "form")))
    browser.find_element(By.NAME, "name").send_keys(unique_name)
    step_wait()
    
    # Select Equipment Type (Waiting for async data)
    type_el = wait.until(EC.visibility_of_element_located((By.NAME, "equipmentTypeId")))
    type_select = Select(type_el)
    wait.until(lambda d: len(type_select.options) > 1) 
    type_select.select_by_index(1)
    step_wait()
    
    # Select Room (Waiting for async data)
    room_el = wait.until(EC.visibility_of_element_located((By.NAME, "roomId")))
    room_select = Select(room_el)
    wait.until(lambda d: len(room_select.options) > 1)
    room_select.select_by_index(1)
    step_wait()
    
    submit_btn = browser.find_element(By.XPATH, "//button[@type='submit']")
    submit_btn.click()
    step_wait()
    
    # 4. Verify Success
    try:
        browser.implicitly_wait(0)
        success_alert = WebDriverWait(browser, 3).until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-success")))
        assert "thành công" in success_alert.text.lower()
        step_wait()
    except Exception:
        # Fallback: Check if the unique name appeared in the table
        time.sleep(2)
        table_text = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "table"))).text
        assert unique_name in table_text
        step_wait()
    finally:
        browser.implicitly_wait(10)

def test_manage_equipment_edit(browser, login, step_wait):
    login("assetstaff@fpt.edu.vn", "Password123!")
    step_wait()
    browser.get("http://localhost:5173/admin/equipment")
    time.sleep(2)
    wait = WebDriverWait(browser, 10)
    
    # Find a test item (or any item)
    try:
        row = wait.until(EC.visibility_of_element_located((By.XPATH, "//tr[contains(., 'Selenium')]")))
    except:
        row = wait.until(EC.visibility_of_element_located((By.XPATH, "//tbody/tr[1]")))
        
    edit_btn = row.find_element(By.CSS_SELECTOR, "a[href*='/edit']")
    edit_btn.click()
    step_wait()
    
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "form")))
    name_input = browser.find_element(By.NAME, "name")
    name_input.clear()
    original_name = name_input.get_attribute("value")
    new_name = f"Edited {original_name}"
    name_input.send_keys(new_name)
    step_wait()
    
    # Wait for rooms and change 
    room_el = wait.until(EC.visibility_of_element_located((By.NAME, "roomId")))
    room_select = Select(room_el)
    wait.until(lambda d: len(room_select.options) > 1)
    # Just select the last room if possible
    room_select.select_by_index(len(room_select.options) - 1)
    step_wait()
    
    # Optional Movement Notes if it appears (it should if room changed)
    try:
        note_input = wait.until(EC.visibility_of_element_located((By.NAME, "note")))
        note_input.send_keys("Selenium Edit Mobility Test")
        step_wait()
    except:
        pass
    
    # Change status 
    status_select = Select(browser.find_element(By.NAME, "status"))
    status_select.select_by_value("UnderMaintenance")
    step_wait()
    
    submit_btn = browser.find_element(By.XPATH, "//button[@type='submit']")
    submit_btn.click()
    step_wait()
    
    # Verify redirect and success
    wait.until(EC.url_contains("/admin/equipment"))
    time.sleep(2)
    table_text = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "table"))).text
    assert new_name in table_text or "Bảo trì" in table_text

def test_manage_equipment_delete(browser, login, step_wait):
    login("assetstaff@fpt.edu.vn", "Password123!")
    step_wait()
    browser.get("http://localhost:5173/admin/equipment")
    time.sleep(2)
    wait = WebDriverWait(browser, 10)
    
    # Identify item to delete
    try:
        row = wait.until(EC.visibility_of_element_located((By.XPATH, "//tr[contains(., 'Edited')]")))
    except:
        row = wait.until(EC.visibility_of_element_located((By.XPATH, "//tbody/tr[1]")))
    
    delete_btn = row.find_element(By.CSS_SELECTOR, "button.btn-danger")
    delete_btn.click()
    step_wait()
    
    # Confirm in Modal
    confirm_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Xóa')]")))
    confirm_btn.click()
    step_wait()
    
    # Verify success alert
    success_alert = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-success")))
    assert "xóa" in success_alert.text.lower()
    step_wait()

def test_manage_equipment_validation_error(browser, login, step_wait):
    login("assetstaff@fpt.edu.vn", "Password123!")
    step_wait()
    browser.get("http://localhost:5173/admin/equipment/create")
    step_wait()
    
    wait = WebDriverWait(browser, 10)
    form = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "form")))
    
    # Test 1: Empty Name
    submit_btn = browser.find_element(By.XPATH, "//button[@type='submit']")
    submit_btn.click()
    step_wait()
    
    # HTML5 required blocks submission, so form is still there
    assert form.is_displayed()
    
    # Test 2: Only Spaces
    name_input = browser.find_element(By.NAME, "name")
    name_input.send_keys("   ")
    submit_btn.click()
    step_wait()
    
    # Check for alert-error (backend validation) or form still shown
    try:
        error_alert = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-error")))
        assert error_alert.is_displayed()
    except:
        assert form.is_displayed()

def test_manage_equipment_edit_validation_error(browser, login, step_wait):
    login("assetstaff@fpt.edu.vn", "Password123!")
    step_wait()
    browser.get("http://localhost:5173/admin/equipment")
    time.sleep(2)
    wait = WebDriverWait(browser, 10)
    
    # Find any item to edit
    row = wait.until(EC.visibility_of_element_located((By.XPATH, "//tbody/tr[1]")))
    edit_btn = row.find_element(By.CSS_SELECTOR, "a[href*='/edit']")
    edit_btn.click()
    step_wait()
    
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "form")))
    name_input = wait.until(EC.visibility_of_element_located((By.NAME, "name")))
    name_input.clear() # Clear existing name
    step_wait()
    
    submit_btn = browser.find_element(By.XPATH, "//button[@type='submit']")
    submit_btn.click()
    step_wait()
    
    # Validation 1: Empty String
    form_still_visible = browser.find_element(By.CSS_SELECTOR, "form").is_displayed()
    assert form_still_visible
    
    # Validation 2: Spaces only
    name_input.send_keys("   ")
    submit_btn.click()
    step_wait()
    
    try:
        error_alert = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-error")))
        assert error_alert.is_displayed()
    except Exception:
        # Fallback: form is still open because submission was blocked
        assert browser.find_element(By.CSS_SELECTOR, "form").is_displayed()
