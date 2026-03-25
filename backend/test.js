import mongoose from 'mongoose';
mongoose.connect('mongodb://127.0.0.1:27017/jobportal').then(async () => {
  const jobs = await mongoose.connection.collection('jobs').find({}, { projection: { title: 1, category: 1, tags: 1 } }).limit(15).toArray();
  console.log(JSON.stringify(jobs, null, 2));
  process.exit(0);
});
