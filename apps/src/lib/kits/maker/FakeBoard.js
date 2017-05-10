/** @file Fake Maker Board for running Maker apps without a board attached. */
import _ from 'lodash';
import {EventEmitter} from 'events'; // provided by webpack's node-libs-browser
import {J5_CONSTANTS, N_COLOR_LEDS} from './PlaygroundConstants';

/**
 * Fake Maker Board for running Maker Toolkit apps without a board attached.
 * Attaches fake, no-op components to the interpreter.
 * @extends EventEmitter
 * @implements MakerBoard
 */
export default class FakeBoard extends EventEmitter {

  /**
   * Open a connection to the board on its configured port.
   * @returns {Promise} resolved when the board is ready to use.
   */
  connect() {
    return Promise.resolve();
  }

  /**
   * Disconnect and clean up the board controller and all components.
   */
  destroy() {
    // Included for compatability with MakerBoard interface
  }

  /**
   * Marshals the board component controllers and appropriate constants into the
   * given JS Interpreter instance so they can be used by student code.
   *
   * @param {JSInterpreter} jsInterpreter
   */
  installOnInterpreter(jsInterpreter) {
    const constructors = {
      Led: FakeLed,
      Board: FakeComponent,
      RGB: FakeColorLed,
      Button: FakeButton,
      Switch: FakeToggleSwitch,
      Piezo: FakeBuzzer,
      Sensor: FakeSensor,
      Thermometer: FakeThermometer,
      Pin: FakeComponent,
      Accelerometer: FakeAccelerometer,
      Animation: FakeComponent,
      Servo: FakeComponent,
      TouchSensor: FakeComponent,
    };

    Object.keys(constructors).forEach(constructorName => {
      const constructor = constructors[constructorName];
      jsInterpreter.addCustomMarshalObject({instance: constructor});
      jsInterpreter.createGlobalProperty(constructorName, constructor);
    });

    const components = {
      board: new FakeComponent(),
      colorLeds: _.range(N_COLOR_LEDS).map(() => new FakeColorLed()),
      led: new FakeLed(),
      toggleSwitch: new FakeToggleSwitch(),
      buzzer: new FakeBuzzer(),
      soundSensor: new FakeSensor(),
      lightSensor: new FakeSensor(),
      tempSensor: new FakeThermometer(),
      accelerometer: new FakeAccelerometer(),
      buttonL: new FakeButton(),
      buttonR: new FakeButton(),
      ...J5_CONSTANTS,
    };

    Object.keys(components).forEach(componentName => {
      jsInterpreter.createGlobalProperty(componentName, components[componentName]);
    });
  }

  /**
   * @param {number} pin
   * @param {number} modeConstant
   */
  pinMode(pin, modeConstant) {
  }

  /**
   * @param {number} pin
   * @param {number} value
   */
  digitalWrite(pin, value) {
  }

  /**
   * @param {number} pin
   * @param {function.<number>} callback
   */
  digitalRead(pin, callback) {
    setTimeout(() => callback(0), 0);
  }

  /**
   * @param {number} pin
   * @param {number} value
   */
  analogWrite(pin, value) {
  }

  /**
   * @param {number} pin
   * @param {function.<number>} callback
   */
  analogRead(pin, callback) {
    setTimeout(() => callback(0), 0);
  }
}

/**
 * Fake board component for use with fake Board controller.
 */
class FakeComponent extends EventEmitter {
  constructor() {
    super();
    this.clazz = 'FakeComponent';
  }
}

class FakeLed extends FakeComponent {
  on() {}
  off() {}
  blink() {}
  toggle() {}
  pulse() {}
}

class FakeColorLed extends FakeLed {
  stop() {}
  intensity() {}
  color() {}
}

class FakeBuzzer extends FakeComponent {
  frequency() {}
  note() {}
  off() {}
  stop() {}
  play() {}
}

class FakeToggleSwitch extends FakeComponent {
  constructor() {
    super();
    this.isOpen = false;
  }
}

class FakeSensor extends FakeComponent {
  constructor() {
    super();
    this.value = null;
    this.threshold = 0;
  }

  start() {}
  getAveragedValue() { return 0; }
  setScale() {}
}

class FakeThermometer extends FakeComponent {
  constructor() {
    super();
    this.F = 32;
    this.C = 0;
  }
}

class FakeAccelerometer extends FakeComponent {
  start() {}
  getAcceleration() { return 0; }
  getOrientation() { return 0; }
}

class FakeButton extends FakeComponent {
  constructor() {
    super();
    this.isPressed = false;
    this.holdtime = 0;
  }
}
