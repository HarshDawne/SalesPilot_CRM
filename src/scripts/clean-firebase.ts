/**
 * Clean Firebase Duplicates
// Run cleanup
cleanFirebase()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
