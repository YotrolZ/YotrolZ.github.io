---
title: iOS 输入框(UITextField)密码明暗文切换
abbrlink: 9d649d6a
date: 2016-05-20 10:51:22
tags:
---


在做明暗文切换(密码输入框)的时候遇见一个坑,就是切换`secureTextEntry`的时候,输入框的光标会偏移,下面列出了一个解决办法及一种明暗文切换的方法
```
- (IBAction)pwdTextSwitch:(UIButton *)sender {
    
    // 前提:在xib中设置按钮的默认与选中状态的背景图 
    // 切换按钮的状态
    sender.selected = !sender.selected;
    
    if (sender.selected) { // 按下去了就是明文
        
        NSString *tempPwdStr = self.pwdInput.text;
        self.pwdInput.text = @""; // 这句代码可以防止切换的时候光标偏移
        self.pwdInput.secureTextEntry = NO;
        self.pwdInput.text = tempPwdStr;
        
    } else { // 暗文
        
        NSString *tempPwdStr = self.pwdInput.text;
        self.pwdInput.text = @"";
        self.pwdInput.secureTextEntry = YES;
        self.pwdInput.text = tempPwdStr;
    }
}
```