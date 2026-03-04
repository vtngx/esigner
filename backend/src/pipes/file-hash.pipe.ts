import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { keccak256 } from 'ethers';
import { readFileSync } from 'node:fs';

@Injectable()
export class FileHashPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const fileBuffer = readFileSync(value.path);
    const documentHash = keccak256(fileBuffer);
    return { ...value, hash: documentHash };
  }
}
