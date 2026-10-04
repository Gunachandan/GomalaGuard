/**
 * Robust GitHub Device Code Poller and Push Script
 */
const https = require('https');
const { execSync } = require('child_process');

const deviceCode = process.argv[2];
const repoName = process.argv[3] || 'GomalaGuard';
const userCode = process.argv[4] || 'E64F-46B4';

if (!deviceCode) {
  console.error('Usage: node github_poller.cjs <device_code> [repo_name] [user_code]');
  process.exit(1);
}

const CLIENT_ID = '178c6fc778ccc68e1d6a';
let pollInterval = 10000; // 10 seconds

function poll() {
  const postData = new URLSearchParams({
    client_id: CLIENT_ID,
    device_code: deviceCode,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
  }).toString();

  const req = https.request('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
    },
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(body);

        if (json.access_token) {
          console.log('\n========================================================');
          console.log('>>> AUTHORIZATION CONFIRMED! Token received.');
          handleSuccess(json.access_token);
          return;
        }

        if (json.error === 'authorization_pending') {
          console.log(`[${new Date().toLocaleTimeString()}] Waiting for authorization at https://github.com/login/device (Code: ${userCode})...`);
          setTimeout(poll, pollInterval);
        } else if (json.error === 'slow_down') {
          pollInterval = (json.interval ? json.interval * 1000 : 12000);
          console.log(`[${new Date().toLocaleTimeString()}] GitHub requested rate limit interval: ${pollInterval / 1000}s. Waiting...`);
          setTimeout(poll, pollInterval);
        } else if (json.error === 'expired_token') {
          console.error('\nDevice code has expired. A new code must be generated.');
          process.exit(1);
        } else {
          console.error('\nGitHub returned error:', json.error, json.error_description);
          process.exit(1);
        }
      } catch (err) {
        console.error('Failed to parse response:', err, body);
        setTimeout(poll, pollInterval);
      }
    });
  });

  req.on('error', (err) => {
    console.error('Network error during poll:', err.message);
    setTimeout(poll, pollInterval);
  });

  req.write(postData);
  req.end();
}

function handleSuccess(token) {
  try {
    // 1. Get authenticated user
    console.log('Querying GitHub user profile...');
    const userJsonRaw = execSync(`curl -s -H "Authorization: token ${token}" https://api.github.com/user`).toString();
    const user = JSON.parse(userJsonRaw);
    const username = user.login;
    console.log(`Successfully authenticated as GitHub user: @${username}`);

    // 2. Configure git remote with token authentication
    console.log(`Configuring git remote origin to https://github.com/Gunachandan/${repoName}.git...`);
    const remoteUrl = `https://${username}:${token}@github.com/Gunachandan/${repoName}.git`;
    try {
      execSync('git remote remove origin');
    } catch {
      // ignore
    }
    execSync(`git remote add origin "${remoteUrl}"`);

    // 3. Push to main
    console.log("Pushing branch 'main' to GitHub...");
    const pushOutput = execSync('git push -u origin main', { stdio: 'pipe' }).toString();
    console.log(pushOutput);

    console.log('\n========================================================');
    console.log(`🎉 SUCCESS! Pushed to https://github.com/Gunachandan/${repoName}`);
    console.log('========================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('Failed during git push:', err);
    process.exit(1);
  }
}

console.log(`Polling GitHub for device authorization (user_code: ${userCode})...`);
poll();
