import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def test_change_room_normal_flow(browser, login, step_wait):
    # 1. Login as Lecturer
    login("lecturer@fpt.edu.vn", "Password123!")
    step_wait()
    
    # 2. Navigate to Schedule Page
    browser.get("http://localhost:5173/schedule")
    step_wait()
    
    # Click 'Next Week' to find the seeded tomorrow slot (since Sunday/Monday boundary)
    wait = WebDriverWait(browser, 10)
    try:
        next_week_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button.btn-secondary svg.lucide-chevron-right")))
        # The svg is inside the button
        next_week_btn.find_element(By.XPATH, "./..").click()
        step_wait()
    except:
        pass # If we are already in the correct week
    
    # 3. Click on a scheduled slot to request change
    time.sleep(2) # wait for grid rendering
    scheduled_slot = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".compact-schedule-card.clickable-card")))
    scheduled_slot.click()
    step_wait()
    
    # 4. Fill change request modal
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "modal-panel-premium")))
    step_wait()
    
    # Select new room
    room_select = browser.find_element(By.CSS_SELECTOR, "select.form-input")
    room_select.click()
    step_wait()
    
    options = room_select.find_elements(By.TAG_NAME, "option")
    for opt in options:
        if opt.get_attribute("value") and not opt.is_selected():
            opt.click()
            break
    step_wait()
    
    # Reason
    unique_reason = f"Selenium Automation: Room Change - {time.time()}"
    reason_area = browser.find_element(By.CLASS_NAME, "modal-textarea-premium")
    reason_area.send_keys(unique_reason)
    step_wait()
    
    # 5. Confirm
    confirm_btn = browser.find_element(By.CSS_SELECTOR, ".btn-modal-primary")
    confirm_btn.click()
    step_wait()
    
    # 6. Verify Creation
    success_alert = wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-success")))
    actual_text = success_alert.text.lower()
    assert "thành công" in actual_text or "đã gửi" in actual_text
    step_wait()

    # 7. Staff Approval
    login("bookingstaff@fpt.edu.vn", "Password123!")
    step_wait()
    
    browser.get("http://localhost:5173/admin/bookings")
    step_wait()
    
    # Locate the row by the unique reason and click its approve (Duyệt) button
    row_xpath = f"//tr[contains(., '{unique_reason}')]"
    row = wait.until(EC.visibility_of_element_located((By.XPATH, row_xpath)))
    approve_btn = row.find_element(By.XPATH, ".//button[contains(text(), 'Duyệt')]")
    approve_btn.click()
    step_wait()
    
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-success")))
    step_wait()

    # 8. Notification Verification
    login("lecturer@fpt.edu.vn", "Password123!")
    step_wait()
    
    # Click notification bell
    bell_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button:has(svg.lucide-bell)")))
    bell_btn.click()
    step_wait()
    
    # Verify latest notification says 'đã được phê duyệt'
    notification_list = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".glass-card ul")))
    notifications = notification_list.find_elements(By.TAG_NAME, "li")
    latest_text = notifications[0].text.lower()
    print(f"Latest Notification: {latest_text}")
    
    assert "đã được phê duyệt" in latest_text
    step_wait()

def test_change_room_abnormal_reject(browser, login, step_wait):
    # 1. Lecturer creates a request
    login("lecturer@fpt.edu.vn", "Password123!")
    step_wait()
    
    browser.get("http://localhost:5173/schedule")
    step_wait()
    wait = WebDriverWait(browser, 10)
    time.sleep(2)
    
    # Navigate to ensure cards exist
    try:
        browser.implicitly_wait(0)
        WebDriverWait(browser, 2).until(EC.presence_of_element_located((By.CSS_SELECTOR, ".compact-schedule-card.clickable-card")))
    except:
        browser.implicitly_wait(10)
        next_week_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button:has(svg.lucide-chevron-right)")))
        next_week_btn.click()
        time.sleep(2)
    finally:
        browser.implicitly_wait(10)

    # Trigger change request
    scheduled_slot = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".compact-schedule-card.clickable-card")))
    scheduled_slot.click()
    step_wait()
    
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "modal-panel-premium")))
    
    # Select new room to bypass "No Change" validation
    room_select = browser.find_element(By.CSS_SELECTOR, "select.form-input")
    room_select.click()
    step_wait()
    options = room_select.find_elements(By.TAG_NAME, "option")
    for opt in options:
        if opt.get_attribute("value") and not opt.is_selected():
            opt.click()
            break
    step_wait()
    
    unique_reason = f"Selenium Reject Test - {time.time()}"
    reason_area = browser.find_element(By.CLASS_NAME, "modal-textarea-premium")
    reason_area.send_keys(unique_reason)
    step_wait()
    
    confirm_btn = browser.find_element(By.CSS_SELECTOR, ".btn-modal-primary")
    confirm_btn.click()
    step_wait()
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-success")))

    # 2. Staff Rejection
    login("bookingstaff@fpt.edu.vn", "Password123!")
    step_wait()
    
    browser.get("http://localhost:5173/admin/bookings")
    step_wait()
    
    # Locate the row by the unique reason and click its reject (Từ chối) button
    row_xpath = f"//tr[contains(., '{unique_reason}')]"
    row = wait.until(EC.visibility_of_element_located((By.XPATH, row_xpath)))
    reject_btn = row.find_element(By.XPATH, ".//button[contains(text(), 'Từ chối') or contains(@class, 'btn-error')]")
    reject_btn.click()
    step_wait()
    
    # ConfirmModal appears
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "glass-panel")))
    textarea = wait.until(EC.visibility_of_element_located((By.TAG_NAME, "textarea")))
    rejection_reason = "Đã hết chỗ trong học kỳ này"
    textarea.send_keys(rejection_reason)
    step_wait()
    
    # Click confirm rejection button
    modal_confirm_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Từ chối' or contains(@class, 'btn-danger')]")))
    modal_confirm_btn.click()
    step_wait()
    
    # Verify success alert
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-success")))
    step_wait()

    # 3. Verify Rejection in My Bookings as Lecturer
    login("lecturer@fpt.edu.vn", "Password123!")
    step_wait()
    
    browser.get("http://localhost:5173/my-bookings")
    step_wait()
    
    # Locate the row again and verify rejection text and reason are displayed
    row_xpath = f"//tr[contains(., '{unique_reason}')]"
    row = wait.until(EC.visibility_of_element_located((By.XPATH, row_xpath)))
    
    row_text = row.text.lower()
    assert "từ chối" in row_text
    assert "đã hết chỗ trong học kỳ này" in row_text
    step_wait()

def test_change_room_abnormal_cancel(browser, login, step_wait):
    # 1. Lecturer creates a request
    login("lecturer@fpt.edu.vn", "Password123!")
    step_wait()
    
    browser.get("http://localhost:5173/schedule")
    step_wait()
    wait = WebDriverWait(browser, 10)
    time.sleep(2)
    
    # Navigate to ensure cards exist (reusing the optimized check)
    try:
        browser.implicitly_wait(0)
        WebDriverWait(browser, 2).until(EC.presence_of_element_located((By.CSS_SELECTOR, ".compact-schedule-card.clickable-card")))
    except:
        browser.implicitly_wait(10)
        next_week_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button:has(svg.lucide-chevron-right)")))
        next_week_btn.click()
        time.sleep(2)
    finally:
        browser.implicitly_wait(10)

    # Trigger change request
    scheduled_slot = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".compact-schedule-card.clickable-card")))
    scheduled_slot.click()
    step_wait()
    
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "modal-panel-premium")))
    
    # Select new room to bypass "No Change" validation
    room_select = browser.find_element(By.CSS_SELECTOR, "select.form-input")
    room_select.click()
    step_wait()
    options = room_select.find_elements(By.TAG_NAME, "option")
    for opt in options:
        if opt.get_attribute("value") and not opt.is_selected():
            opt.click()
            break
    step_wait()
    
    unique_id = str(time.time())[-6:]
    unique_reason = f"Selenium Cancel Test - {unique_id}"
    reason_area = browser.find_element(By.CLASS_NAME, "modal-textarea-premium")
    reason_area.send_keys(unique_reason)
    step_wait()
    
    confirm_btn = browser.find_element(By.CSS_SELECTOR, ".btn-modal-primary")
    confirm_btn.click()
    step_wait()
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "alert-success")))

    # 2. Cancel via My Bookings
    browser.get("http://localhost:5173/my-bookings")
    step_wait()
    
    try:
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "table.glass-table")))
        # Find the row containing our unique reason
        row_xpath = f"//tr[contains(., '{unique_reason}')]"
        row = wait.until(EC.visibility_of_element_located((By.XPATH, row_xpath)))
        
        # Click the 'Huỷ' button in that row
        cancel_btn = row.find_element(By.XPATH, ".//button[contains(., 'Huỷ')]")
        cancel_btn.click()
        step_wait()
        
        # Confirm cancellation in modal
        confirm_cancel = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[contains(@class, 'glass-panel')]//button[contains(text(), 'Xác nhận huỷ')]")))
        confirm_cancel.click()
        step_wait()
        
        # Verify success
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(@class, 'alert-success') or @role='status' or contains(text(), 'thành công')]")))
        step_wait()
    except Exception as e:
        print(f"Room change cancellation failed: {e}")
        raise e

def test_change_room_abnormal_validation(browser, login, step_wait):
    from selenium.webdriver.support.ui import Select
    # 1. Login as Lecturer
    login("lecturer@fpt.edu.vn", "Password123!")
    step_wait()
    
    # 2. Navigate to Schedule Page
    browser.get("http://localhost:5173/schedule")
    step_wait()
    
    wait = WebDriverWait(browser, 10)
    time.sleep(3) # Wait for schedule grid to load
    
    # Ensure we are in a week with data (usually next week after fresh import)
    try:
        # Check if any cards exist. Use a short 2s wait for this check specifically.
        # Disable implicit wait temporarily so the explicit wait takes priority.
        browser.implicitly_wait(0)
        WebDriverWait(browser, 2).until(EC.presence_of_element_located((By.CSS_SELECTOR, ".compact-schedule-card.clickable-card")))
    except:
        browser.implicitly_wait(10) # Restore for the button find
        try:
            next_week_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button:has(svg.lucide-chevron-right)")))
            next_week_btn.click()
            step_wait()
            # Wait for next week data
            time.sleep(2)
        except:
            pass
    finally:
        # Final safety to ensure it's restored
        browser.implicitly_wait(10)

    # 3. Initiate Change Request
    # Find any scheduled card to open the modal
    scheduled_cards = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".compact-schedule-card.clickable-card")))
    scheduled_cards[0].click()
    step_wait()
    
    # 4. Fill Modal with Invalid Details
    wait.until(EC.visibility_of_element_located((By.CLASS_NAME, "modal-panel-premium")))
    step_wait()
    
    # Wait for all selects to be present
    selects = wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "select.form-input")))
    # selects[0] = Room, selects[1] = SlotType, selects[2] = Slot
    
    # Select Slot Type: "Ca mới (10 tuần)" -> Value: "New"
    slot_type_select = Select(selects[1])
    slot_type_select.select_by_value("New")
    step_wait()
    
    # Set Date to 04/07/2026 (verified as mm/dd/yyyy format)
    date_input = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='date']")))
    date_input.click()
    date_input.send_keys("04072026")
    step_wait()
    
    # Select Room DE-313
    room_select = Select(selects[0])
    found_room = False
    for opt in room_select.options:
        if "DE-313" in opt.text:
            room_select.select_by_visible_text(opt.text)
            found_room = True
            break
    if not found_room:
        room_select.select_by_index(1)
    step_wait()
    
    # Select Slot 1
    # Note: Selecting Slot Type above might have re-rendered Slot select, so re-fetch if needed
    # but since it's the same list of selects in DOM, should be fine. 
    # If not, we re-find them.
    select_els = browser.find_elements(By.CSS_SELECTOR, "select.form-input")
    slot_select = Select(select_els[2])
    slot_select.select_by_value("1") 
    step_wait()
    
    # Fill reason
    reason_area = browser.find_element(By.CLASS_NAME, "modal-textarea-premium")
    reason_area.send_keys("Selenium Conflict Test: Room DE-313 Slot 1 on April 7th")
    step_wait()
    
    # 5. Confirm and Verify Error
    confirm_btn = browser.find_element(By.CSS_SELECTOR, ".btn-modal-primary")
    confirm_btn.click()
    step_wait()
    
    # Conflict error should appear (status 400 from backend)
    try:
        # Capture error from alert-error or role='status' (toast)
        error_msg = wait.until(EC.visibility_of_element_located((By.XPATH, "//*[@role='status' or contains(@class, 'alert-error')]")))
        actual_text = error_msg.text.lower()
        print(f"Conflict error received: {actual_text}")
        
        # Verify keywords (Vietnamese and English)
        keywords = ["trùng", "xếp lịch", "lớp khác", "không khả dụng", "overlap", "conflict", "bận"]
        assert any(k in actual_text for k in keywords)
        step_wait()
    except Exception as e:
        print(f"Conflict validation failed: {e}")
        raise e
