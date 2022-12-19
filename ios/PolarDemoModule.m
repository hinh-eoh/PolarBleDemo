#import "React/RCTBridgeModule.h"
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(PolarBleModule, RCTEventEmitter)
RCT_EXTERN_METHOD(supportedEvents)
RCT_EXTERN_METHOD(connectToDevice:(NSString *)deviceId)
RCT_EXTERN_METHOD(startScan)
RCT_EXTERN_METHOD(streamECG:(NSString *)deviceId)
RCT_EXTERN_METHOD(disConnect:(NSString *)deviceId)
@end

