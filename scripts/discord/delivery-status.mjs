export function deliveryStatusFromLog(log) {
  if (/Delivered \[Founders' Brief .+\] to Discord/.test(log)) return 'delivered';
  if (/SKIPPED: DISCORD_BRIEF_WEBHOOK not configured/.test(log)) return 'unconfigured';
  return 'missing';
}

const invokedDirectly = process.argv[1]?.split(/[\\/]/).pop() === 'delivery-status.mjs';
if (invokedDirectly) {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    input += chunk;
  });
  process.stdin.on('end', () => {
    console.log(deliveryStatusFromLog(input));
  });
}
