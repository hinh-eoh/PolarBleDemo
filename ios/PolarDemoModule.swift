//
//  PolarDemoModule.swift
//  PolarBleDemo
//
//  Created by Dinh Hinh on 14/12/2022.
//

import Foundation
import PolarBleSdk
import RxSwift
import CoreBluetooth
import React

@objc(PolarBleModule)
class PolarBleModule: RCTEventEmitter, PolarBleApiObserver, PolarBleApiPowerStateObserver, PolarBleApiDeviceFeaturesObserver, PolarBleApiDeviceHrObserver, PolarBleApiLogger, PolarBleApiDeviceInfoObserver {
  
  @Published private(set) var isSearchOn: Bool = false
  
  private var searchDisposable: Disposable?
  private var ecgDisposable: Disposable?
  
  private var ECG_DATA = "EcgData"
  private var HrData = "HrData"
  private var STATUS_CHANGE = "status_change"
  private var BATTERY_LEVEL = "battery"
  private var ON_DEVICE_FOUND = "onDeviceFound"
  
  public static var emitter : RCTEventEmitter!
  var api: PolarBleApi = PolarBleApiDefaultImpl.polarImplementation(
      DispatchQueue.main,
      features: Features.allFeatures.rawValue
    );
  
  override init() {
      super.init()
       PolarBleModule.emitter = self
       api.observer = self
       api.powerStateObserver = self
       api.deviceInfoObserver = self
       api.deviceFeaturesObserver = self
       api.deviceHrObserver = self
       api.logger = self
       api.polarFilter(false)
  }
  
  @objc func connectToDevice(_ id: String) -> Void {
      do {
        try self.api.connectToDevice(id)
      } catch {
        print("Connect device error")
      }
    }
  
  @objc func disConnect(_ id: String) -> Void {
    do {
      try self.api.disconnectFromDevice(id)
    } catch {
      let result: NSMutableDictionary = [:]
      result["status"] = "disconnect fail"
      self.sendEvent(withName: self.STATUS_CHANGE, body: result)
      print("Disconnect fail")
    }
    
  }
  
  @objc func startScan() -> Void {
    if !isSearchOn {
                isSearchOn = true
                searchDisposable = api.searchForDevice()
                    .observe(on: MainScheduler.instance)
                    .subscribe{ e in
                        switch e {
                        case .completed:
                            NSLog("search complete")
                            self.isSearchOn = false
                        case .error(let err):
                            NSLog("search error: \(err)")
                            self.isSearchOn = false
                        case .next(let item):
//                          self.sendEvent(withName: self.ON_DEVICE_FOUND, body: ["id": item.deviceId,  "name": item.name, "address": item.address])
                          if(item.name.contains("Polar")) {
                            NSLog("polar device found11111: \(item.name) connectable: \(item.deviceId) address: \(item.address.uuidString)")
                            let result: NSMutableDictionary = [:]
                            result["id"] = item.deviceId
                            result["address"] = item.address.uuidString
                            result["name"] = item.name
                            self.sendEvent(withName: self.ON_DEVICE_FOUND, body: result)
                          }
                        }
                    }
            } else {
                isSearchOn = false
                searchDisposable?.dispose()
            }
  }
  
  @objc
  func streamECG(_ deviceId: String) -> Void {
    api.requestStreamSettings(deviceId, feature: DeviceStreamingFeature.ecg).asObservable().flatMap({
      (settings) -> Observable<PolarEcgData> in
      return self.api.startEcgStreaming(deviceId, settings: settings.maxSettings())
    }).observe(on: MainScheduler.instance).subscribe { e in
      switch e {
      case .next(let data):
        let result: NSMutableDictionary = [:]
        result["id"] = deviceId
        result["timeStamp"] = data.timeStamp
        let samples: NSMutableArray = []
        for µv in data.samples {
          samples.add(µv)
        }
        result["samples"] = samples
        print("aaaaa101010", data.samples)
        self.sendEvent(withName: self.ECG_DATA, body: result)
      case .error(let err):
        NSLog("start ecg error: \(err)")
//        d!.ecgToggle = nil
      case .completed:
         NSLog("ecg finished")
        break
      }
    }
  }
  
  override func supportedEvents() -> [String]! {
      return [
        self.ON_DEVICE_FOUND,
        self.ECG_DATA,
        self.STATUS_CHANGE,
        self.BATTERY_LEVEL,
        self.HrData,
      ]
    }
  
  func deviceConnecting(_ identifier: PolarBleSdk.PolarDeviceInfo) {
    let result: NSMutableDictionary = [:]
    result["id"] = identifier.deviceId
    result["status"] = "connecting"
    self.sendEvent(withName: self.STATUS_CHANGE, body: result)
    print("kkkkkk7---- \(identifier)")
  }
  
  func deviceConnected(_ identifier: PolarBleSdk.PolarDeviceInfo) {
    let result: NSMutableDictionary = [:]
    result["id"] = identifier.deviceId
    result["status"] = "connected"
    self.sendEvent(withName: self.STATUS_CHANGE, body: result)
    print("kkkkkk8\(identifier)")
  }
  
  func deviceDisconnected(_ identifier: PolarBleSdk.PolarDeviceInfo) {
    let result: NSMutableDictionary = [:]
    result["id"] = identifier.deviceId
    result["status"] = "disconnected"
    self.sendEvent(withName: self.STATUS_CHANGE, body: result)
    print("kkkkkk9\(identifier)")
  }
  
  func message(_ str: String) {
    
  }
  
  func hrValueReceived(_ identifier: String, data: PolarHrData) {
    let result: NSMutableDictionary = [:]
    result["hr"] = data.hr
    self.sendEvent(withName: self.HrData, body: result)
    print("kkkkkk1\(data.hr)")
  }
  
  func hrFeatureReady(_ identifier: String) {
    print("kkkkkk2\(identifier)")
  }
  
  func ftpFeatureReady(_ identifier: String) {
    print("kkkkkk3\(identifier)")
  }
  
  func streamingFeaturesReady(_ identifier: String, streamingFeatures: Set<PolarBleSdk.DeviceStreamingFeature>) {
    print("kkkkkk4\(identifier)")
  }
  
  func blePowerOn() {
    print("kkkkkk5")
  }
  
  func blePowerOff() {
    print("kkkkkk6")
  }
  
  @objc func polarInit() -> Void {
    
  }
  
  func batteryLevelReceived(_ identifier: String, batteryLevel: UInt) {
    
  }
  
  func disInformationReceived(_ identifier: String, uuid: CBUUID, value: String) {
    
  }
  
//  var api = PolarBleApiDefaultImpl.polarImplementation(DispatchQueue.main, features: Features.allFeatures.rawValue)
//  var deviceId = ""

  @objc
  func test() -> String {
    print("12312312313")
    return "1234"
  }

  @objc func testlog(_ value: String) -> Void {
    print("aaaaaa111")
  }
}
