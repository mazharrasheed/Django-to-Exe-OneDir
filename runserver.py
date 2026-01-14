import subprocess
import tkinter as tk
from tkinter import messagebox
import webbrowser
import random


random_number = random.randint(1000, 9999)
def open_webpage(url):
    webbrowser.open_new(url)

def start_django_server():
   
    try:
        # Replace 'python' with your Python executable and 'manage.py' with the path to your manage.py file
        subprocess.Popen(['C:/Users/mazha/AppData/Local/Programs/Python/Python313/python.exe ', 'D:\Coding\django to exe/manage.py', 'runserver' ,f'{random_number}'])
        messagebox.showinfo("Server Started", "Django server has started successfully.")
    except Exception as e:
        messagebox.showerror("Error", f"Failed to start Django server: {str(e)}")

# Create a Tkinter window
window = tk.Tk()
window.title("Filling Station")
window.geometry('250x200')

# Create a button to start the Django server
btn_start_server = tk.Button(window, text="Start Server", command=start_django_server)
btn_start_server.pack(pady=20)

# Function to open a web page when the button is clicked
def open_web_page():
    url = f"http://127.0.0.1:{random_number}/"  # Replace this with your desired URL
    open_webpage(url)

# Create a button to open the web page
btn_open_webpage = tk.Button(window, text="Start Filling Station", command=open_web_page)
btn_open_webpage.pack(pady=20)

# Run the Tkinter event loop
window.mainloop()








