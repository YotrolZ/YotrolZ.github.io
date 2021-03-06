---
title: iOS开发中模糊效果(毛玻璃)的实现方案
abbrlink: 58cd7a6b
date: 2015-10-16 10:47:37
tags:
---

> 方案一:利用系统的`CoreImage`(滤镜)

- 重点理解`CIImage`,`CIFilter`,`CIContext`,`CGImageRef`

- 滤镜处理的过程比较慢,会造成加载图片缓慢的现象(等一会才看到图片),尽量放到子线程执行

```objc
- (void)viewDidLoad {
    [super viewDidLoad];

    // 加载一张图片
    UIImage *image = [UIImage imageNamed:@"che"];
  
    /**************CoreImage部分**************/
    
    // 1.创建CIImage
    CIImage *ciImage = [[CIImage alloc] initWithImage:image];
    
    // 2.创建滤镜CIFilter
    CIFilter *blurFilter = [CIFilter filterWithName:@"CIGaussianBlur"];
    
    // 2.1.将CIImage输入到滤镜中
    [blurFilter setValue:ciImage forKey:kCIInputImageKey];
    
    // 可以通过该方法查看我们可以设置的值(如模糊度等)
    NSLog(@"%@", [blurFilter attributes]);
    
    // 2.2设置模糊度
    [blurFilter setValue:@(2) forKey:@"inputRadius"];

    // 2.3将处理好的图片输出
    CIImage *outCiImage = [blurFilter valueForKey:kCIOutputImageKey];

    // 3.CIContext(option参数为nil代表用CPU渲染,若想用GPU渲染请查看此参数)
    CIContext *context = [CIContext contextWithOptions:nil];
    
    // 4.获取CGImage句柄
    CGImageRef outCGImage = [context createCGImage:outCiImage fromRect:[outCiImage extent]];
    
    // 5.获取最终的图片
    UIImage *blurImage = [UIImage imageWithCGImage:outCGImage];
    
    // 6.释放CGImage
    CGImageRelease(outCGImage);
    /*****************************************/
    
    UIImageView *imageV = [[UIImageView alloc] initWithFrame:CGRectMake(0, 0, 750 / 2, 1334 / 2)];
    imageV.image = blurImage;
    imageV.center = self.view.center;
    [self.view addSubview:imageV];
    
}
```

> 方案二:利用UIImage+ImageEffects分类

- 将`UIImage+ImageEffects.h`和`UIImage+ImageEffects.m`文件加载进工程
- 包含`UIImage+ImageEffects.h`
- `UIImage+ImageEffects`[文件路径](https://github.com/YouXianMing/UIImageBlur)

```objc
#import "ViewController.h"

#import "UIImage+ImageEffects.h"
- (void)viewDidLoad {
    [super viewDidLoad];

    // 原始图片
    UIImage *sourceImage = [UIImage imageNamed:@"che"];

    // 对图片进行模糊处理
    UIImage *blurImage = [sourceImage blurImageWithRadius:10];
    
    // 加载模糊处理后的图片
    UIImageView *imageV = [[UIImageView alloc] initWithImage:blurImage];
    [self.view addSubview:imageV];

}
```

> 方案三:利用UIVisualEffectView(iOS8)

```objc
#import "ViewController.h"

@interface ViewController ()

/** 背景 */
@property (nonatomic, strong) UIScrollView *scrollView;

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];

    // 添加展示的背景,用于显示动态模糊(背景能够滚动,便于查看动态的模糊)
    self.scrollView = [[UIScrollView alloc] initWithFrame:self.view.bounds];
    UIImageView *imageV = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"fengjing"]];
    self.scrollView.contentSize = imageV.image.size;
    self.scrollView.bounces = NO;
    [self.scrollView addSubview:imageV];
    [self.view addSubview:self.scrollView];
    
    /***************添加模糊效果***************/
    // 1.创建模糊view
    UIVisualEffectView *effectView = [[UIVisualEffectView alloc] initWithEffect:[UIBlurEffect effectWithStyle:UIBlurEffectStyleLight]];
    
    // 2.设定模糊View的尺寸
    effectView.frame = CGRectMake(0, 100, 375, 200);
    
    // 3.添加到view当中
    [self.view addSubview:effectView];
    
    
    
    /******************添加显示文本******************/
    UILabel *label = [[UILabel alloc] initWithFrame:effectView.bounds];
    label.text = @"模糊效果";
    label.font = [UIFont systemFontOfSize:40];
    label.textAlignment = NSTextAlignmentCenter;
    
    /****************添加模糊效果的子view****************/
    // 1.创建出子模糊view
    UIVisualEffectView *subEffectView = [[UIVisualEffectView alloc] initWithEffect:[UIVibrancyEffect effectForBlurEffect:(UIBlurEffect *)effectView.effect]];
    
    // 2.设置子模糊view的尺寸
    subEffectView.frame = effectView.bounds;
    
    // 3.将子模糊view添加到effectView的contentView上才能显示
    [effectView.contentView addSubview:subEffectView];
    
    // 4.添加要显示的view来达到特殊效果
    [subEffectView.contentView addSubview:label];
 
}

@end
```

![iOS8-模糊效果.gif](http://upload-images.jianshu.io/upload_images/590107-5fb845d54c0134a0.gif?imageMogr2/auto-orient/strip)
