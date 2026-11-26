# commit-city

Your year on GitHub, built as a pixel city at night.

![A year of contributions as a pixel city at night](https://raw.githubusercontent.com/thiraphat-ps-dev/commit-city/output/city.svg)

Every week of the last year is a building. The more you committed that week, the taller it stands; the more days you showed up, the more of its windows are lit. Your three busiest weeks get blinking antennas, and this week, which isn't over yet, is still going up under a crane. Stars twinkle, windows flicker, cars cross, the city shimmers upside down in the river, and the moon is in tonight's phase.

It is one animated SVG, rebuilt every day by a GitHub Action, that you show in your profile README like any image.

## Put it on your profile

1. In your profile repository (the one named after you), add `.github/workflows/commit-city.yml`:

   ```yaml
   name: commit-city
   on:
     schedule:
       - cron: '0 0 * * *' # every day
     workflow_dispatch:
   permissions:
     contents: write
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: thiraphat-ps-dev/commit-city@v1
           with:
             github_user_name: ${{ github.repository_owner }}
             outputs: dist/city.svg
         - name: Put it on the output branch
           run: |
             cd dist
             git init -q -b output
             git add city.svg
             git -c user.name='github-actions[bot]' -c user.email='41898282+github-actions[bot]@users.noreply.github.com' commit -qm 'Build the city'
             git push -fq "https://x-access-token:${{ github.token }}@github.com/${{ github.repository }}.git" output
   ```

2. Run it once from the Actions tab (**commit-city → Run workflow**).

3. Add the city to your `README.md`, with your user name in both places:

   ```markdown
   ![My year on GitHub as a pixel city](https://raw.githubusercontent.com/YOUR-NAME/YOUR-NAME/output/city.svg)
   ```

## Inputs

| Input | Default | |
|---|---|---|
| `github_user_name` | (required) | Whose contributions to build from |
| `github_token` | `${{ github.token }}` | The workflow's own token reads public contributions. To count private ones too, pass a personal token with `read:user` |
| `outputs` | `dist/city.svg` | Where to write the SVG, one path per line |

## Run it yourself

No dependencies, just Node 20 or newer:

```sh
gh api graphql -f query='query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{contributionCount date weekday}}}}}}' -F login=YOUR-NAME > data.json
node scripts/build.mjs data.json city.svg YOUR-NAME
```

`node scripts/sample.mjs sample.json 150` makes up a quieter year to try it on.

## License

MIT
