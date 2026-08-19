import mistyHighlandsImage from '../../assets/bg1.jpg'
import goldenPeaksImage from '../../assets/bg2.jpg'
import oceanSunsetImage from '../../assets/bg3.jpg'
import {
  defaultOrganisationBackgroundId,
  organisationBackgroundIds,
} from './organisationBackgroundOptions.js'

export const organisationBackgrounds = [
  {
    id: organisationBackgroundIds[0],
    name: 'Misty Highlands',
    description: 'Cool mountain scenery with soft morning light.',
    image: mistyHighlandsImage,
  },
  {
    id: organisationBackgroundIds[1],
    name: 'Golden Peaks',
    description: 'Warm mountain scenery with gentle golden light.',
    image: goldenPeaksImage,
  },
  {
    id: organisationBackgroundIds[2],
    name: 'Ocean Sunset',
    description: 'A calm ocean scene with a soft evening sky.',
    image: oceanSunsetImage,
  },
]

export { defaultOrganisationBackgroundId }

export function getOrganisationBackground(backgroundId) {
  return (
    organisationBackgrounds.find(
      (background) => background.id === backgroundId,
    ) ?? organisationBackgrounds[0]
  )
}
