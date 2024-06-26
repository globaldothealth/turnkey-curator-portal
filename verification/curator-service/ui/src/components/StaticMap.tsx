import { Geometry } from '../api/models/Case';
import React from 'react';

export default function StaticMap(props: { geometry: Geometry }): JSX.Element {
    return (
        <img
            src={`https://api.mapbox.com/styles/v1/mapbox/light-v10/static/${props.geometry.longitude},${props.geometry.latitude},5,0/450x200?access_token=${import.meta.env.VITE_APP_PUBLIC_MAPBOX_TOKEN}`}
            alt="map"
        ></img>
    );
}
