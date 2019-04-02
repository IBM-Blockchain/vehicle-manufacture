import { Manufacturer } from '../participants/manufacturer';

/*
SPDX-License-Identifier: Apache-2.0
*/

export interface IVehicleDetails {
  make: Manufacturer;
  modelType: string;
  colour: string;
}
