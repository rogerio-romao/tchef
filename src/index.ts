// packages
import { consola } from 'consola';

export default function sum(a: number, b: number): number {
    return a + b;
}

consola.info('Using consola 3.0.0');
consola.start('Building project...');
consola.warn('A new version of consola is available: 3.0.1');
consola.success('Project built!');
consola.error(new Error('This is an example error. Everything is fine!'));
consola.box('I am a simple box');
