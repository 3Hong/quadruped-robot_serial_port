
//###################串口接收######################
//宏定义
let data_tx = pins.createBuffer(38);
let gait_mode = 0;
let rc_spd_cmd_X = 0.00 //x速度
let rc_spd_cmd_y = 0.00 //y速度
let rc_att_rate_cmd = 0.00 // 速度
let rc_spd_cmd_z = 0.00 //
let rc_pos_cmd = 0.00 //高度
let rc_att_cmd_x = 0.00 //俯仰
let rc_att_cmd_y = 0.00 //侧摆
let rc_att_cmd = 0.00 //航向角
let usb_send_cnt = 0
let state = 0

//###########################TX################################    
//发送数据初始化
function Data_int() {
    for (let i = 0; i < 38; i++) {
        data_tx[i] = 0x00
    }
}
//数据发送
function Data_send() {
    let i = 0;
    let cnt_reg = 0;
    let sum = 0x00;
    usb_send_cnt = cnt_reg
    data_tx[usb_send_cnt++] = 0xCA
    data_tx[usb_send_cnt++] = 0xCF
    data_tx[usb_send_cnt++] = 0x93
    data_tx[usb_send_cnt++] = 0x21

    data_tx[usb_send_cnt++] = gait_mode
    get_float_hex(rc_spd_cmd_X)
    get_float_hex(rc_spd_cmd_y)
    get_float_hex(rc_att_rate_cmd)
    get_float_hex(rc_spd_cmd_z)
    get_float_hex(rc_pos_cmd)
    get_float_hex(rc_att_cmd_x)
    get_float_hex(rc_att_cmd_y)
    get_float_hex(rc_att_cmd)
    for (i = 0; i < usb_send_cnt; i++) {
        sum += data_tx[i]
    }
    data_tx[usb_send_cnt] = sum
    if (state == 1) {
        serial.writeBuffer(data_tx)
    }
    // basic.pause(100)
}
//-------------数据转换----------------
function DecToBinTail(dec: number, pad: number) {
    let bin = "";
    let i;
    for (i = 0; i < pad; i++) {
        dec *= 2;
        if (dec >= 1) {
            dec -= 1;
            bin += "1";
        }
        else {
            bin += "0";
        }
    }
    return bin;
}

function DecToBinHead(dec: number, pad: number) {
    let bin = "";
    let i;
    for (i = 0; i < pad; i++) {
        bin = parseInt((dec % 2).toString()) + bin;
        dec /= 2;
    }
    return bin;
}

function get_float_hex(decString: number) {
    let dec = decString;
    let sign;
    let signString;
    let decValue = parseFloat(Math.abs(decString).toString());
    let fraction = 0;
    let exponent = 0;
    let ssss = []

    if (decString.toString().charAt(0) == '-') {
        sign = 1;
        signString = "1";
    }
    else {
        sign = 0;
        signString = "0";
    }
    if (decValue == 0) {
        fraction = 0;
        exponent = 0;
    }
    else {
        exponent = 127;
        if (decValue >= 2) {
            while (decValue >= 2) {
                exponent++;
                decValue /= 2;
            }
        }
        else if (decValue < 1) {
            while (decValue < 1) {
                exponent--;
                decValue *= 2;
                if (exponent == 0)
                    break;
            }
        }
        if (exponent != 0) decValue -= 1; else decValue /= 2;

    }
    let fractionString = DecToBinTail(decValue, 23);
    let exponentString = DecToBinHead(exponent, 8);
    let ss11 = parseInt(signString + exponentString + fractionString, 2)
    data_tx[usb_send_cnt++] = ((ss11 << 24) >> 24)
    data_tx[usb_send_cnt++] = ((ss11 << 16) >> 24)
    data_tx[usb_send_cnt++] = ((ss11 << 8) >> 24)
    data_tx[usb_send_cnt++] = ((ss11 >> 24))
}
//###########################RX################################
//-----------------宏定义-----------------
let data_RX = pins.createBuffer(200);
let data_s = pins.createBuffer(200);
let rx_s = 0
let len_s = 0
let s = 1
let anal_cnt = 0
let robot_mode = 0
serial.setRxBufferSize(1000)

let state_sdk = 0
let tmie_1 = 0.0000
//-----------------数据解析-----------------
function uart_anal(data_h: any) {
    if (rx_s == 0 && data_h == 0xBA) {
        rx_s = 1;
        data_s[0] = data_h

    }
    else
        if (rx_s == 1 && data_h == 0xBF) {
            rx_s = 2;
            data_s[1] = data_h
        }
        else
            if (rx_s == 2 && data_h > 0 && data_h < 0xF1) {
                rx_s = 3;
                data_s[2] = data_h
            }
            else
                if (rx_s == 3 && data_h < 255) {
                    rx_s = 4
                    data_s[3] = data_h
                    len_s = data_h
                    s = 0;
                }
                else
                    if (rx_s == 4 && len_s > 0) {
                        len_s--;
                        // serial.writeNumber(len_s)
                        data_s[4 + s++] = data_h
                        //serial.writeNumber(s)
                        if (len_s == 0)
                            rx_s = 5
                    }
                    else
                        if (rx_s == 5) {
                            rx_s = 0
                            data_s[4 + s] = data_h
                            decode(data_s)
                        }
}
//-----------------数据下表累加-----------------
function floatFromDataf(data_f: Buffer, len1: number) {
    anal_cnt += 4
}
//-----------------数据信息获取-----------------
function decode(S: Buffer) {
    // basic.showNumber(1)  
    anal_cnt = 4
    if (S[2] == 0x92) {
        for (let i = 0; i < 23; i++)
            anal_cnt += 4
        anal_cnt += 1
        robot_mode = S[anal_cnt]
    }
}
//-----------------数据接收-----------------
function Data_RX() {
    let data_rx
    data_rx = serial.readBuffer(0)
    for (let i = 0; i <= 200; i++) {
        uart_anal(data_rx[i])
    }
}






//% color="#C814B8" weight=25 icon="\uf1d4"
namespace moco_底盘模式 {
    //运动模式选择
    export enum mode {
        //% block="前进"
        前进,
        //% block="后退"
        后退,
        //% block="左转"
        左转,
        //% block="右转"
        右转,
        //% block="左移"
        左移,
        //% block="右移"
        右移
    }
    //角度选择 
    export enum mode1 {
        //% block="左摆"
        左摆,
        //% block="右摆"
        右摆,
        //% block="俯视"
        俯视,
        //% block="仰视"
        仰视,
        //% block="航线角"
        航向角
    }
    //速度选择
    export enum speed {
        //% block="1"
        快,
        //% block="中"
        中,
        //% block="慢"
        慢,
        //% block="停"
        停
    }
    //步态选择
    export enum gait {
        //% block="慢跑"
        慢跑,
        //% block="快跑"
        快跑
    }


    //###########################图形模块函数################################
    //% block=MOCO.机器狗反馈信息 block="机器狗反馈信息"
    //%weight=1
    export function 机器狗反馈信息(): number {
        return robot_mode;
    }

    //% block=MOCO.机器人狗高度 block="机器人狗|高度 %h"
    //%weight=3
    //% h.min=0.00 h.max=10.00
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 机器人狗高度(h: number): void {
        rc_pos_cmd = h * 0.01
        Data_send();
    }

    //% block=MOCO.机器狗启动 block="机器狗启动"
    //%weight=2
    export function 机器狗启动(): void {
        gait_mode = 4
        rc_pos_cmd = 0.1
        state = 1
        basic.pause(3000)
        for (let i = 0; i < 15; i++) {
            Data_send();
            basic.pause(100)
        }
        while (1) {
            Data_RX();
            if (robot_mode == 1)
                return
            Data_send();
        }
    }

    //% block=MOCO.机器狗原地站立 block="机器狗原地站立"
    //%weight=4
    export function 机器狗原地站立(): void {
        let i = 0
        if (robot_mode == 1)
            return
        gait_mode = 5
        Data_send()
        while (1) {
            Data_RX()
            if (robot_mode == 2) {
                gait_mode = 4
                i = 1
                Data_send()
                Data_RX()
            }
            if (robot_mode == 1 && i == 1) {
                return
            }
            Data_send()
        }
    }

    //% block=MOCO.机器狗断电 block="机器狗断电"
    //%weight=6
    export function 机器狗断电(): void {
        let i = 0
        gait_mode = 5
        Data_send()
        while (1) {
            Data_RX()
            if (robot_mode == 2) {
                gait_mode = 4
                i = 1
                Data_send()
                Data_RX()
            }
            if (robot_mode == 1 && i == 1) {
                rc_pos_cmd = 0.00
                for (let w = 0; w < 15; w++) {
                    Data_send()
                    Data_RX()
                    basic.pause(100)
                }
                return
            }
            Data_send()
        }
    }

    //% block=MOCO.机器狗步态 block="机器狗|步态 %g"
    //%weight=5
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 机器狗步态(g: gait): void {
        switch (g) {
            case gait.慢跑:
                gait_mode = 1; break;
                while (1) {
                    Data_RX()
                    Data_send()
                    if (robot_mode == 4)
                        return
                }
        }
    }

    //% block=MOCO.机器狗控制 block="机器狗控制|  模式 %m|速度 %speed1|时间 %time1"
    //%weight=7
    //% speed1.min=0.00 speed1.max=10.00
    //% time1.min=0 time1.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 机器狗控制(m: mode, speed1: number, time1: number): void {
        let Sum_S = 0.00
        Sum_S = speed1 / 100.00
        switch (m) {
            case mode.前进:
                rc_spd_cmd_X = Sum_S; break;
            case mode.后退:
                rc_spd_cmd_X = (-Sum_S); break;
            case mode.左转:
                rc_att_rate_cmd = (speed1 * 5); break;
            case mode.右转:
                rc_att_rate_cmd = (-speed1 * 5); break;
            case mode.左移:
                rc_spd_cmd_y = Sum_S; break;
            case mode.右转:
                rc_spd_cmd_y = (-Sum_S); break;
        }
        for (let e = 0; e < time1; e++) {
            Data_RX()
            Data_send()
            basic.pause(100)
        }
    }
    //% block=MOCO.机器狗控制角度 block="机器狗控制角度| %m|角度 %speed1|时间 %time1"
    //%weight=7
    //% speed1.min=0.00 speed1.max=10.00
    //% time1.min=0 time1.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=10
    export function 机器狗控制角度(m: mode1, speed1: number, time1: number): void {
        switch (m) {
            case mode1.俯视:
                rc_att_cmd_x = speed1; break;
            case mode1.仰视:
                rc_att_cmd_x = speed1; break;
            case mode1.左摆:
                rc_att_cmd_y = speed1; break;
            case mode1.右摆:
                rc_att_cmd_y = speed1; break;
            case mode1.航向角:
                rc_att_cmd = speed1; break;
        }
        for (let e = 0; e < time1; e++) {
            Data_RX()
            Data_send()
            basic.pause(100)
        }
    }

}

//% color="#0014B8" weight=24 icon="\uf1d8"
namespace moco_语音控制 {

    export enum mode {
        //% block="开启"
        开启,
        //% block="关闭"
        关闭,
    }

    export enum mode1 {
        //% block="自定义"
        自定义,
        //% block="关闭"
        关闭,
    }

    //---------------宏定义-----------
    let voice_mode = 0x00 //语音信息 
    let data_TX = 0
    let data_RX = 0

    //---------------语音数据接收-----------
    function voice_TX() {
        control.inBackground(function () {
            while (1) {
                pins.setPull(DigitalPin.P12, PinPullMode.PullDown)
                data_RX = pins.spiWrite(data_TX)
                basic.pause(20)
                pins.setPull(DigitalPin.P12, PinPullMode.PullUp)
                serial.writeNumber(1)
            }
        })
    }

    //---------------数据解析-----------
    function voice_Parsing() {
        voice_mode = 0
        //..................
    }

    //---------------语音执行-----------
    function voice_Execute() {
        voice_TX()
        let v_mode = voice_mode
        switch (v_mode) {
            case 1: rc_spd_cmd_X = 0; break
            //............................
        }
    }

    //% block
    export function 语音信息返回(): number {
        voice_Parsing()
        return voice_mode
    }

    //% block
    export function 语音功能(m: mode): void {
        pins.spiPins(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13)
        pins.setPull(DigitalPin.P12, PinPullMode.PullUp)
        pins.spiFrequency(1000000)
    }
}

//% color="#001400" weight=23 icon="\uf1d1"
namespace moco_图像识别 {
    export enum colour {
        //% block="红色"
        红色,
        //% block="黑色"
        黑色,
    }
    export enum mode {
        //% block="开启"
        开启,
        //% block="关闭"
        关闭,
    }

    //% block
    export function 颜色信息返回(): void {

    }

    //% block = moco_图像识别 block="颜色识别|  %c| %m"
    export function 颜色识别(c: colour, m: mode): void {

    }

    //% block = moco_小球跟踪 block="小球跟踪|  %c| %m"
    export function 小球跟踪(c: colour, m: mode): void {

    }
}