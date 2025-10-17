import * as natural from 'natural';
import Sentiment from 'sentiment';
import nlp from 'compromise';
import Graph from 'graphology';
import { dijkstra } from 'graphology-shortest-path';
import _ from 'lodash';

console.log('✅ natural:', typeof natural.TfIdf);
console.log('✅ sentiment:', typeof new Sentiment());
console.log('✅ compromise:', typeof nlp);
console.log('✅ graphology:', typeof Graph);
console.log('✅ shortest-path:', typeof dijkstra);
console.log('✅ lodash:', typeof _);

console.log('\n🎉 All Phase 2 dependencies imported successfully!');
