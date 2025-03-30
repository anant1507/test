import os
import cv2
import time

attrib_list = {
    "exposure": cv2.CAP_PROP_EXPOSURE,
    "contrast": cv2.CAP_PROP_CONTRAST
}

def check_settings():
    max_attempts = 3
    attempt = 0
    VIDEO_CHECK = None
    
    while attempt < max_attempts:
        try:
            VIDEO_CHECK = cv2.VideoCapture(0)
            if not VIDEO_CHECK.isOpened():
                raise RuntimeError("Cannot open camera")
                
            # Give camera time to initialize
            time.sleep(2)
            
            print("*"*28)
            print("* Checking camera settings *")
            print("*"*28)
            
            if not os.path.exists("camera_settings.log"):
                with open("camera_settings.log", "w") as f:
                    for attrib, index in attrib_list.items():
                        value = VIDEO_CHECK.get(index)
                        f.write(f"{attrib} = {value}\n")
            else:
                with open("camera_settings.log", "r") as f:
                    lines = f.read().split("\n")
                    for line in lines:
                        if " = " in line:
                            attrib, value = line.split(" = ")
                            if attrib in attrib_list:
                                VIDEO_CHECK.set(attrib_list[attrib], float(value))
            
            for attrib, index in attrib_list.items():
                print(f"{attrib} = {VIDEO_CHECK.get(index)}")
            
            VIDEO_CHECK.release()
            return True
            
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
            attempt += 1
            if VIDEO_CHECK and VIDEO_CHECK.isOpened():
                VIDEO_CHECK.release()
            time.sleep(1)
            
    print("Failed to initialize camera after multiple attempts")
    return False

def reset_settings():
    if not os.path.exists("camera_settings.log"):
        print("'camera_settings.log' does not exist!")
        return False
    
    max_attempts = 3
    attempt = 0
    
    while attempt < max_attempts:
        try:
            VIDEO_CHECK = cv2.VideoCapture(0)
            if not VIDEO_CHECK.isOpened():
                raise RuntimeError("Cannot open camera")
                
            time.sleep(2)
            
            with open("camera_settings.log", "r") as f:
                lines = f.read().split("\n")
                for line in lines:
                    if " = " in line:
                        attrib, value = line.split(" = ")
                        if attrib in attrib_list:
                            VIDEO_CHECK.set(attrib_list[attrib], float(value))
            
            VIDEO_CHECK.release()
            return True
            
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
            attempt += 1
            if 'VIDEO_CHECK' in locals() and VIDEO_CHECK and VIDEO_CHECK.isOpened():
                VIDEO_CHECK.release()
            time.sleep(1)
    
    print("Failed to reset camera settings")
    return False