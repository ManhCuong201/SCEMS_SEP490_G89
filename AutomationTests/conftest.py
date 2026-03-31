import pytest
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

def pytest_addoption(parser):
    parser.addoption("--step-delay", action="store", default=0.5, help="Delay in seconds after each test step")

@pytest.fixture(autouse=True)
def wait_after_test():
    yield
    time.sleep(5)

@pytest.fixture(scope="session")
def step_delay(request):
    return float(request.config.getoption("--step-delay"))

@pytest.fixture
def step_wait(step_delay):
    def _wait():
        if step_delay > 0:
            time.sleep(step_delay)
    return _wait

@pytest.fixture(scope="session")
def browser():
    chrome_options = Options()
    # chrome_options.add_argument("--headless") # Uncomment for headless execution
    chrome_options.add_argument("--start-maximized")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    driver.maximize_window()
    driver.implicitly_wait(10)
    
    # Give user 5 seconds to arrange windows side-by-side
    print("\n[INFO] BROWSER LAUNCHED: Waiting 5 seconds for you to arrange your windows...")
    time.sleep(5)
    
    yield driver
    driver.quit()

@pytest.fixture
def login(browser):
    def _login(username, password):
        browser.get("http://localhost:5173/auth/login")
        # Wait for the elements to be present
        wait = WebDriverWait(browser, 10)
        email_input = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']")))
        email_input.send_keys(username)
        password_input = browser.find_element(By.CSS_SELECTOR, "input[type='password']")
        password_input.send_keys(password)
        browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        
        # IMPORTANT: Wait for redirect to complete so routes are rendered
        wait.until(EC.url_changes("http://localhost:5173/auth/login"))
    return _login
