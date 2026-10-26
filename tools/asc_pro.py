"""Creates (or updates) the Shift Calendar PRO subscriptions in App Store Connect, set up like CaloCare:
  - subscription group "Shift Calendar PRO";
  - monthly US$1.99 (19.000đ) with a 3-day free trial, yearly US$17.99 (199.000đ) with a 1-week free trial;
  - English and Vietnamese texts, availability everywhere, prices equalised for every territory;
  - the App Review screenshot of the purchase sheet when a screenshot path is given.

Run by the "listing" job (with the screenshot) or by hand (without):
    ASC_KEY_ID=… ASC_ISSUER_ID=… ASC_KEY_P8=… python3 tools/asc_pro.py [store/ios/iap/pro.png]
Every step tolerates "already done". Failures are warnings so the app itself can still ship.
"""
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request

import asc_listing as asc

GROUP = 'Shift Calendar PRO'
PLANS = [  # product id, period, US price, group level (1 = highest), free trial, texts
    ('com.napigo.shiftcalendar.pro.monthly', 'ONE_MONTH', '1.99', 2, 'THREE_DAYS',
     {'en-US': ('Shift Calendar PRO', 'Unlimited shifts, yearly stats, exports'), 'vi': ('Shift Calendar PRO', 'Không giới hạn ca, thống kê năm, xuất file')}),
    ('com.napigo.shiftcalendar.pro.yearly', 'ONE_YEAR', '17.99', 1, 'ONE_WEEK',
     {'en-US': ('Shift Calendar PRO', 'Unlimited shifts, yearly stats, exports'), 'vi': ('Shift Calendar PRO', 'Không giới hạn ca, thống kê năm, xuất file')}),
]
REVIEW_NOTE = ('PRO unlocks unlimited shift types, employees and vacations, yearly statistics and the income goal, '
               'Excel / PDF / calendar (.ics) export, tides and storm alerts, colour themes and all sticker packs. '
               'The purchase sheet opens from Settings → "Upgrade to PRO" or from any locked feature; it has Restore Purchases '
               'and links to the Terms of Use (Apple standard EULA) and the Privacy Policy.')


def req(method, path, body=None, allow=()):
    request = urllib.request.Request(asc.API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                     headers={'Authorization': 'Bearer ' + asc.token(), 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            raw = response.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        errors = json.loads(e.read() or b'{}').get('errors', [])
        text = '; '.join(f"{x.get('title', '')}: {x.get('detail', '')}" for x in errors)
        if e.code in allow:
            return None
        raise RuntimeError(f'{method} {path.split("?")[0]} -> {e.code} {text}')


def warn(message):
    print('::warning title=PRO products::' + message.replace('%', '%25').replace('\n', '%0A'))


def note(message):
    print('::notice title=PRO products::' + message.replace('%', '%25').replace('\n', '%0A'))


def pages(path):
    out = []
    while path:
        page = req('GET', path)
        out += page['data']
        nxt = page.get('links', {}).get('next')
        path = nxt.replace(asc.API, '') if nxt else None
    return out


def upload(kind, rel, owner_type, owner_id, data):
    shot = req('POST', f'/v1/{kind}', {'data': {'type': kind, 'attributes': {'fileName': 'pro.png', 'fileSize': len(data)},
               'relationships': {rel: {'data': {'type': owner_type, 'id': owner_id}}}}})['data']
    for op in shot['attributes']['uploadOperations']:
        part = data[op['offset']:op['offset'] + op['length']]
        headers = {h['name']: h['value'] for h in op.get('requestHeaders', [])}
        urllib.request.urlopen(urllib.request.Request(op['url'], data=part, method=op['method'], headers=headers), timeout=300).read()
    req('PATCH', f'/v1/{kind}/{shot["id"]}', {'data': {'type': kind, 'id': shot['id'],
        'attributes': {'uploaded': True, 'sourceFileChecksum': hashlib.md5(data).hexdigest()}}})


def main(screenshot):
    app_id = req('GET', f'/v1/apps?filter[bundleId]={asc.BUNDLE_ID}')['data'][0]['id']
    territories = [{'type': 'territories', 'id': t['id']} for t in pages('/v1/territories?limit=200')]
    data = open(screenshot, 'rb').read() if screenshot and os.path.exists(screenshot) else None

    groups = req('GET', f'/v1/apps/{app_id}/subscriptionGroups')['data']
    group = next((g for g in groups if g['attributes'].get('referenceName') == GROUP), None)
    if not group:
        group = req('POST', '/v1/subscriptionGroups', {'data': {'type': 'subscriptionGroups', 'attributes': {'referenceName': GROUP},
                    'relationships': {'app': {'data': {'type': 'apps', 'id': app_id}}}}})['data']
        print('subscription group created')
    gid = group['id']
    glocs = req('GET', f'/v1/subscriptionGroups/{gid}/subscriptionGroupLocalizations')['data']
    for locale in ('en-US', 'vi'):
        if not any(l['attributes']['locale'] == locale for l in glocs):
            req('POST', '/v1/subscriptionGroupLocalizations', {'data': {'type': 'subscriptionGroupLocalizations', 'attributes': {'locale': locale, 'name': GROUP},
                'relationships': {'subscriptionGroup': {'data': {'type': 'subscriptionGroups', 'id': gid}}}}}, allow=(409,))

    existing = req('GET', f'/v1/subscriptionGroups/{gid}/subscriptions?limit=50')['data']
    for pid, period, usd, level, trial, texts in PLANS:
        try:
            sub = next((x for x in existing if x['attributes'].get('productId') == pid), None)
            if not sub:
                sub = req('POST', '/v1/subscriptions', {'data': {'type': 'subscriptions', 'attributes': {'name': f'PRO {period.title().replace("_", " ")}',
                          'productId': pid, 'subscriptionPeriod': period, 'groupLevel': level, 'reviewNote': REVIEW_NOTE, 'familySharable': False},
                          'relationships': {'group': {'data': {'type': 'subscriptionGroups', 'id': gid}}}}})['data']
                print(pid, 'created')
            sid = sub['id']

            locs = req('GET', f'/v1/subscriptions/{sid}/subscriptionLocalizations')['data']
            for locale, (name, desc) in texts.items():
                have = next((l for l in locs if l['attributes']['locale'] == locale), None)
                if have:
                    req('PATCH', f'/v1/subscriptionLocalizations/{have["id"]}', {'data': {'type': 'subscriptionLocalizations', 'id': have['id'],
                        'attributes': {'name': name, 'description': desc}}}, allow=(409,))
                else:
                    req('POST', '/v1/subscriptionLocalizations', {'data': {'type': 'subscriptionLocalizations', 'attributes': {'locale': locale, 'name': name, 'description': desc},
                        'relationships': {'subscription': {'data': {'type': 'subscriptions', 'id': sid}}}}}, allow=(409,))

            req('POST', '/v1/subscriptionAvailabilities', {'data': {'type': 'subscriptionAvailabilities', 'attributes': {'availableInNewTerritories': True},
                'relationships': {'subscription': {'data': {'type': 'subscriptions', 'id': sid}}, 'availableTerritories': {'data': territories}}}}, allow=(409,))

            if not req('GET', f'/v1/subscriptions/{sid}/prices?limit=1')['data']:
                point = next((x for x in pages(f'/v1/subscriptions/{sid}/pricePoints?filter[territory]=USA&limit=200')
                              if x['attributes'].get('customerPrice') == usd), None)
                if point:
                    points = [point['id']] + [x['id'] for x in pages(f'/v1/subscriptionPricePoints/{point["id"]}/equalizations?limit=200')]
                    for pp in points:
                        req('POST', '/v1/subscriptionPrices', {'data': {'type': 'subscriptionPrices', 'attributes': {'startDate': None, 'preserveCurrentPrice': False},
                            'relationships': {'subscription': {'data': {'type': 'subscriptions', 'id': sid}},
                                              'subscriptionPricePoint': {'data': {'type': 'subscriptionPricePoints', 'id': pp}}}}}, allow=(409,))
                    print(pid, f'priced US${usd} in {len(points)} territories')
                else:
                    warn(f'No US${usd} price point for {pid}; set it in App Store Connect.')

            # Free trial in every territory (an introductory offer is per territory)
            have_trial = {o['relationships']['territory']['data']['id'] for o in pages(f'/v1/subscriptions/{sid}/introductoryOffers?include=territory&limit=200')
                          if o.get('relationships', {}).get('territory', {}).get('data')}
            added = 0
            for terr in territories:
                if terr['id'] in have_trial:
                    continue
                if req('POST', '/v1/subscriptionIntroductoryOffers', {'data': {'type': 'subscriptionIntroductoryOffers',
                        'attributes': {'duration': trial, 'offerMode': 'FREE_TRIAL', 'numberOfPeriods': 1},
                        'relationships': {'subscription': {'data': {'type': 'subscriptions', 'id': sid}}, 'territory': {'data': terr}}}}, allow=(409, 422)) is not None:
                    added += 1
            print(pid, f'free trial {trial}: {added} territories added, {len(have_trial)} already set')

            if data:
                old = req('GET', f'/v1/subscriptions/{sid}/appStoreReviewScreenshot', allow=(404,))
                if not (old and old.get('data')):
                    upload('subscriptionAppStoreReviewScreenshots', 'subscription', 'subscriptions', sid, data)
                    print(pid, 'review screenshot uploaded')
            note(f"{pid}: {req('GET', f'/v1/subscriptions/{sid}')['data']['attributes'].get('state')}")
        except Exception as e:  # the app ships either way
            warn(f'{pid}: {str(e)[-1200:]}')


if __name__ == '__main__':
    try:
        main(sys.argv[1] if len(sys.argv) > 1 else None)
    except Exception as e:
        warn(str(e)[-1500:])
